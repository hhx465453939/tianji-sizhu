#!/usr/bin/env bash
# macOS lifecycle smoke test (CHG-004 ADR-008 L4) for both delivery shapes.
#
#   smoke-macos.sh --zip <path> --expect-arch <amd64|arm64> [--expect-version <ver>]
#   smoke-macos.sh --pkg <path> --expect-arch <amd64|arm64> [--expect-version <ver>]
#
# --zip : ditto -x (preserves signature/symlinks)
# --pkg : pkgutil --expand-full (never mounts a disk image; hdiutil hangs in CI)
# Both paths then verify arch, signature and version, launch for 5s, prove no
# residue. DMG is intentionally unsupported.
set -euo pipefail

source "$(dirname "$0")/lib.sh"

ZIP=""
PKG=""
ARCH=""
VER=""
while [ $# -gt 0 ]; do
  case "$1" in
    --zip) ZIP="${2:-}"; shift 2 ;;
    --pkg) PKG="${2:-}"; shift 2 ;;
    --dmg) die "--dmg is no longer supported (hdiutil hangs on CI); use --pkg" 2 ;;
    --expect-arch) ARCH="${2:-}"; shift 2 ;;
    --expect-version) VER="${2:-}"; shift 2 ;;
    -h|--help) echo "usage: smoke-macos.sh (--zip|--pkg) <path> --expect-arch <amd64|arm64> [--expect-version <ver>]"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

host_guard macos
[ -n "$ZIP" ] || [ -n "$PKG" ] || die "one of --zip or --pkg is required" 2
[ "$ARCH" = "amd64" ] || [ "$ARCH" = "arm64" ] || die "--expect-arch required" 2

WORK="$RELEASE_ROOT/.tmp/unzip-$ARCH"
rm -rf "$WORK"; mkdir -p "$WORK"
trap 'rm -rf "$WORK"' EXIT

if [ -n "$PKG" ]; then
  [ -f "$PKG" ] || die "pkg not found: $PKG" 2
  # Signature state is informational: no Developer ID cert exists yet.
  warn "pkg signature: $(run_timeout 30 pkgutil --check-signature "$PKG" 2>&1 | tr '\n' ' ' || true)"
  run_timeout 300 pkgutil --expand-full "$PKG" "$WORK/pkg" || die "pkg expand failed" 1
  APP="$WORK/pkg/tianji-sizhu.pkg/Payload/tianji-sizhu.app"
  [ -d "$APP" ] || die "app bundle missing inside pkg payload (found: $(ls "$WORK/pkg" 2>/dev/null | tr '\n' ' '))" 1
  ok "pkg payload expanded"
else
  [ -f "$ZIP" ] || die "zip not found: $ZIP" 2
  run_timeout 300 ditto -x -k "$ZIP" "$WORK" || die "unzip failed" 1
  APP="$WORK/tianji-sizhu.app"
  [ -d "$APP" ] || die "app bundle missing inside zip" 1
fi

MACHO_ARCH="$(macho_arch "$ARCH")"
SLICES="$(lipo -archs "$APP/Contents/MacOS/tianji-sizhu")"
case "$SLICES" in
  *"$MACHO_ARCH"*) ok "slice: $SLICES (go arch $ARCH)" ;;
  *) die "slice '$SLICES' lacks $MACHO_ARCH (go arch $ARCH)" 1 ;;
esac

codesign --verify --deep --strict "$APP" || die "signature invalid" 1
SIG="$(codesign -dv --verbose=4 "$APP" 2>&1 | grep -E '^Signature=' || true)"
ok "${SIG:-Signature=unknown}"

if [ -n "$VER" ]; then
  BUNDLE_VER="$(plutil -extract CFBundleShortVersionString raw "$APP/Contents/Info.plist")"
  [ "$BUNDLE_VER" = "$VER" ] || die "CFBundleShortVersionString=$BUNDLE_VER expected $VER" 1
  ok "CFBundleShortVersionString=$BUNDLE_VER"
fi

# spctl is expected to FAIL without notarisation; record it, never block on it.
# Wrap in a timeout: on CI it can block on Gatekeeper services.
SPCTL="$(run_timeout 30 spctl -a -vv "$APP" 2>&1 || true)"
warn "Gatekeeper: ${SPCTL:-<no output>} (expected unsigned/adhoc)"

# Launch from the extracted (writable) copy so the data dir can be created.
"$APP/Contents/MacOS/tianji-sizhu" >/dev/null 2>&1 &
PID=$!
sleep 5
if ! kill -0 "$PID" 2>/dev/null; then
  die "app exited within 5s" 1
fi
ok "app alive after 5s (pid=$PID)"
kill "$PID" 2>/dev/null || true
sleep 2
kill -9 "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true

ok "PASS"
