#!/usr/bin/env bash
# Build one macOS architecture: app bundle + .pkg installer + portable .app zip.
#
#   build-macos.sh --arch amd64|arm64 [--skip-frontend]
#
# macOS packages can ONLY be built on macOS (no WebKit/SDK on Linux).
#
# Installer format is .pkg, NOT .dmg: hdiutil enters an uninterruptible kernel
# state on macOS 14 GitHub runners (25+ min, SIGKILL ineffective). pkgbuild is a
# pure file packer - no image mounting, no kernel involvement - so it cannot hang.
#
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
require_cmd pkgbuild
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
# Keep the full log: swallowing stdout made a CI failure undiagnosable.
BUILD_LOG="$RELEASE_ROOT/.tmp/wails-darwin-$ARCH.log"
if ! ( cd "$RELEASE_ROOT" && wails build -platform "darwin/$ARCH" -s ) > "$BUILD_LOG" 2>&1; then
  echo "----- wails build output (tail) -----" >&2
  tail -40 "$BUILD_LOG" >&2
  die "wails build failed (full log: .tmp/wails-darwin-$ARCH.log)" 3
fi

APP="$RELEASE_ROOT/build/bin/tianji-sizhu.app"
[ -d "$APP" ] || die "app bundle missing: $APP" 3

# Architecture assertion: exactly the requested single slice.
MACHO_ARCH="$(macho_arch "$ARCH")"
SLICES="$(lipo -archs "$APP/Contents/MacOS/tianji-sizhu")"
case "$SLICES" in
  *"$MACHO_ARCH"*) ok "bundle slice: $SLICES (go arch $ARCH)" ;;
  *) die "bundle slice '$SLICES' does not contain $MACHO_ARCH (go arch $ARCH)" 1 ;;
esac

# Ad-hoc signature must be present (kernel refuses unsigned arm64 binaries).
codesign --verify --deep --strict "$APP" || die "codesign verification failed" 1
ok "codesign verified (adhoc)"

# Keep a copy of the bundle for portable packaging.
rm -rf "$OUT/tianji-sizhu.app"
cp -R "$APP" "$OUT/tianji-sizhu.app"

# --- installer (.pkg) ---------------------------------------------------
# pkgbuild packs a directory tree without mounting anything, so it is immune to
# the hdiutil hang that forced us off DMG.
PKG_STAGE="$OUT/pkg-$ARCH"
rm -rf "$PKG_STAGE"; mkdir -p "$PKG_STAGE"
cp -R "$APP" "$PKG_STAGE/"

PKG_OUT="$OUT/tianji-sizhu-$VERSION-macos-$ARCH-installer.pkg"
rm -f "$PKG_OUT"
run_timeout 420 pkgbuild \
  --root "$PKG_STAGE" \
  --identifier "com.tianjisizhu.desktop" \
  --version "$VERSION" \
  --install-location "/Applications" \
  --ownership recommended \
  "$PKG_OUT" >/dev/null 2>&1 \
  || die "pkgbuild failed or timed out" 3

[ -s "$PKG_OUT" ] || die "pkgbuild produced no output" 3
ok "installer.pkg: $(basename "$PKG_OUT")  $(file_bytes "$PKG_OUT") bytes"

# --- portable (.app zip) ------------------------------------------------
# ditto preserves the ad-hoc signature and symlinks; plain zip corrupts both.
ZIP_OUT="$OUT/tianji-sizhu-$VERSION-macos-$ARCH-app.zip"
rm -f "$ZIP_OUT"
run_timeout 420 ditto -c -k --keepParent "$APP" "$ZIP_OUT" >/dev/null 2>&1 \
  || die "ditto failed or timed out" 3

ok "app.zip: $(basename "$ZIP_OUT")  $(file_bytes "$ZIP_OUT") bytes"
log "done ($ARCH) -> $OUT"
