#!/usr/bin/env bash
# Build one macOS architecture: app bundle + DMG.
#
#   build-macos.sh --arch amd64|arm64 [--skip-frontend]
#
# macOS packages can ONLY be built on macOS (no WebKit/SDK on Linux).
# Exit: 0 ok | 1 check failed | 2 precondition failed | 3 build failed
set -euo pipefail

source "$(dirname "$0")/lib.sh"

ARCH=""
SKIP_FRONTEND=0
while [ $# -gt 0 ]; do
  case "$1" in
    --arch) ARCH="${2:-}"; shift 2 ;;
    --skip-frontend) SKIP_FRONTEND=1; shift ;;
    -h|--help) echo "usage: build-macos.sh --arch <amd64|arm64> [--skip-frontend]"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ "$ARCH" = "amd64" ] || [ "$ARCH" = "arm64" ] || die "--arch must be amd64 or arm64" 2
host_guard macos
require_cmd go
require_cmd wails
require_cmd node
require_cmd ditto
require_cmd hdiutil
require_cmd codesign

VERSION="$(read_version)"
assert_semver "$VERSION"
ensure_go_caches

if [ "$SKIP_FRONTEND" != "1" ]; then
  log "building frontend bundle"
  if command -v pnpm >/dev/null 2>&1; then
    ( cd "$RELEASE_ROOT/frontend" && pnpm build ) || die "frontend build failed" 3
  else
    ( cd "$RELEASE_ROOT/frontend" && npm run build ) || die "frontend build failed" 3
  fi
fi

OUT="$RELEASE_ROOT/.tmp/release/$VERSION"
mkdir -p "$OUT"

log "wails build darwin/$ARCH"
( cd "$RELEASE_ROOT" && wails build -platform "darwin/$ARCH" -s ) >/dev/null || die "wails build failed" 3

APP="$RELEASE_ROOT/build/bin/tianji-sizhu.app"
[ -d "$APP" ] || die "app bundle missing: $APP" 3

# Architecture assertion: exactly the requested single slice.
SLICES="$(lipo -archs "$APP/Contents/MacOS/tianji-sizhu")"
case "$SLICES" in
  *"$ARCH"*) ok "bundle slice: $SLICES" ;;
  *) die "bundle slice '$SLICES' does not contain $ARCH" 1 ;;
esac

# Ad-hoc signature must be present (kernel refuses unsigned arm64 binaries).
codesign --verify --deep --strict "$APP" || die "codesign verification failed" 1
ok "codesign verified (adhoc)"

# Keep a copy of the bundle for portable packaging.
rm -rf "$OUT/tianji-sizhu.app"
cp -R "$APP" "$OUT/tianji-sizhu.app"

# --- DMG ---------------------------------------------------------------
STAGE="$OUT/dmg-$ARCH"
rm -rf "$STAGE"; mkdir -p "$STAGE"
cp -R "$APP" "$STAGE/"
ln -s /Applications "$STAGE/Applications"
cat > "$STAGE/安装说明.txt" <<'TXT'
首次打开若提示"无法验证开发者"：
  右键 tianji-sizhu.app → 打开 → 打开
或执行：
  xattr -dr com.apple.quarantine /Applications/tianji-sizhu.app
（请勿全局关闭 Gatekeeper）
TXT

DMG="$OUT/tianji-sizhu-$VERSION-macos-$ARCH.dmg"
rm -f "$DMG"
hdiutil create -volname "天机四柱 $VERSION ($ARCH)" \
  -srcfolder "$STAGE" -fs HFS+ -format UDZO -ov "$DMG" >/dev/null \
  || die "hdiutil create failed" 3

ok "dmg: $(basename "$DMG")  $(file_bytes "$DMG") bytes"
log "done ($ARCH) -> $OUT"
