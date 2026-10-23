#!/usr/bin/env bash
# Package a portable ZIP from an already-built artifact set.
#
#   package-portable.sh --os windows|macos --arch amd64|arm64
#
# Windows: <root>/tianji-sizhu.exe + 使用说明.txt, deflated with zip -9
# macOS  : ditto -c -k --keepParent (preserves bundle signature & symlinks)
set -euo pipefail

source "$(dirname "$0")/lib.sh"

OS=""
ARCH=""
usage() {
  cat <<'USAGE'
usage: package-portable.sh --os <windows|macos> --arch <amd64|arm64>

Reads artifacts from .tmp/release/<version>/ and writes
  tianji-sizhu-<ver>-<os>-<arch>-portable.zip
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --os) OS="${2:-}"; shift 2 ;;
    --arch) ARCH="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

case "$OS" in windows|macos) ;; *) die "--os must be windows or macos" 2 ;; esac
case "$ARCH" in amd64|arm64) ;; *) die "--arch must be amd64 or arm64" 2 ;; esac

VERSION="$(read_version)"
OUT="$RELEASE_ROOT/.tmp/release/$VERSION"
ZIP_NAME="tianji-sizhu-$VERSION-$OS-$ARCH-portable.zip"
STAGE="$OUT/portable-$OS-$ARCH"

[ -d "$OUT" ] || die "no artifacts for $VERSION (run the build first): $OUT" 2

rm -rf "$STAGE"
mkdir -p "$STAGE"

if [ "$OS" = "windows" ]; then
  host_guard windows

  APP="$OUT/tianji-sizhu-$VERSION-windows-$ARCH.exe"
  [ -f "$APP" ] || die "app binary missing: $APP" 2

  PKG_DIR="$STAGE/tianji-sizhu-$VERSION-windows-$ARCH"
  mkdir -p "$PKG_DIR"
  cp "$APP" "$PKG_DIR/tianji-sizhu.exe"

  cat > "$PKG_DIR/使用说明.txt" <<'TXT'
天机四柱 · 免安装版
====================

1. 解压后直接双击 tianji-sizhu.exe 运行，无需安装。
2. 排盘记录保存在本目录下的 data\ 文件夹；整个目录可拷到 U 盘随身带走。
3. 若无法启动，多半是缺少 WebView2 运行时：
   Windows 10 需先安装 "Microsoft Edge WebView2 Runtime"，
   或改用安装版（setup.exe，会自动安装运行时）。

卸载：直接删除本目录即可，不写注册表、不进 Program Files。

校验下载完整性（PowerShell）：
   Get-FileHash .\tianji-sizhu-<ver>-windows-<arch>-portable.zip -Algorithm SHA256
TXT

  # zip(1) is absent from Git Bash by default; fall back to PowerShell's
  # Compress-Archive, which ships with Windows. Both keep the top-level dir.
  if command -v zip >/dev/null 2>&1; then
    ( cd "$STAGE" && zip -r -9 -q "$OUT/$ZIP_NAME" "$(basename "$PKG_DIR")" )
  else
    local_win_stage="$(cygpath -w "$PKG_DIR" 2>/dev/null || echo "$PKG_DIR")"
    local_win_zip="$(cygpath -w "$OUT/$ZIP_NAME" 2>/dev/null || echo "$OUT/$ZIP_NAME")"
    powershell -NoProfile -Command "Compress-Archive -Path '$local_win_stage' -DestinationPath '$local_win_zip' -Force" \
      || die "Compress-Archive failed" 3
  fi
  ok "portable: $ZIP_NAME  $(file_bytes "$OUT/$ZIP_NAME") bytes"

else
  host_guard macos
  require_cmd ditto

  APP="$OUT/tianji-sizhu.app"
  [ -d "$APP" ] || die "app bundle missing: $APP" 2

  cp -R "$APP" "$STAGE/"
  cat > "$STAGE/安装说明.txt" <<'TXT'
天机四柱 · 免安装版 (macOS)
============================

1. 将 tianji-sizhu.app 拖到「应用程序」或任意目录即可运行。
2. 首次打开若提示"无法验证开发者"：右键 → 打开 → 打开；或执行
     xattr -dr com.apple.quarantine /Applications/tianji-sizhu.app
   （请勿全局关闭 Gatekeeper）
3. 排盘数据位于 ~/Library/Application Support/TianJi-SiZhu/data。
TXT

  # ditto (not zip) keeps the code signature and internal symlinks intact.
  ( cd "$STAGE" && ditto -c -k --keepParent tianji-sizhu.app "$OUT/$ZIP_NAME" )
  ok "portable: $ZIP_NAME  $(file_bytes "$OUT/$ZIP_NAME") bytes"
fi
