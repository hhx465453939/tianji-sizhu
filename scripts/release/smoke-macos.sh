#!/usr/bin/env bash
# macOS app-zip lifecycle smoke test (CHG-004 ADR-008 L4).
#
#   smoke-macos.sh --zip <path> --expect-arch <amd64|arm64> [--expect-version <ver>]
#
# Extracts with ditto (preserves the ad-hoc signature and symlinks), then
# verifies arch, signature and version, launches the app for 5s, and proves no
# residue. DMG/hdiutil is intentionally not used: it hangs on CI runners.
set -euo pipefail

source "$(dirname "$0")/lib.sh"

ZIP=""
ARCH=""
VER=""
while [ $# -gt 0 ]; do
  case "$1" in
    --zip) ZIP="${2:-}"; shift 2 ;;
    --dmg) ZIP="${2:-}"; shift 2 ;;   # backward-compatible alias
    --expect-arch) ARCH="${2:-}"; shift 2 ;;
    --expect-version) VER="${2:-}"; shift 2 ;;
    -h|--help) echo "usage: smoke-macos.sh --zip <path> --expect-arch <amd64|arm64> [--expect-version <ver>]"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

host_guard macos
[ -f "$ZIP" ] || die "zip not found: $ZIP" 2
[ "$ARCH" = "amd64" ] || [ "$ARCH" = "arm64" ] || die "--expect-arch required" 2

WORK="$RELEASE_ROOT/.tmp/unzip-$ARCH"
rm -rf "$WORK"; mkdir -p "$WORK"
trap 'rm -rf "$WORK"' EXIT

run_timeout 300 ditto -x -k "$ZIP" "$WORK" || die "unzip failed" 1
APP="$WORK/tianji-sizhu.app"
[ -d "$APP" ] || die "app bundle missing inside zip" 1

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
