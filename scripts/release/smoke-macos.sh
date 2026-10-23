#!/usr/bin/env bash
# macOS DMG lifecycle smoke test (CHG-004 ADR-008 L4).
#
#   smoke-macos.sh --dmg <path> --expect-arch <amd64|arm64> [--expect-version <ver>]
#
# Mounts read-only, verifies signature/arch/version, launches the app for 5s,
# then detaches and proves no mount residue. Exit: 0 pass | 1 fail | 2 precondition
set -euo pipefail

source "$(dirname "$0")/lib.sh"

DMG=""
ARCH=""
VER=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dmg) DMG="${2:-}"; shift 2 ;;
    --expect-arch) ARCH="${2:-}"; shift 2 ;;
    --expect-version) VER="${2:-}"; shift 2 ;;
    -h|--help) echo "usage: smoke-macos.sh --dmg <path> --expect-arch <amd64|arm64> [--expect-version <ver>]"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

host_guard macos
[ -f "$DMG" ] || die "dmg not found: $DMG" 2
[ "$ARCH" = "amd64" ] || [ "$ARCH" = "arm64" ] || die "--expect-arch required" 2

MNT="$RELEASE_ROOT/.tmp/mnt-$ARCH"
rm -rf "$MNT"; mkdir -p "$MNT"

cleanup() {
  hdiutil detach "$MNT" -force >/dev/null 2>&1 || true
  rm -rf "$MNT"
}
trap cleanup EXIT

hdiutil attach -nobrowse -readonly -mountpoint "$MNT" "$DMG" >/dev/null || die "attach failed" 1
APP="$MNT/tianji-sizhu.app"
[ -d "$APP" ] || die "app bundle missing inside dmg" 1

MACHO_ARCH="$(macho_arch "$ARCH")"
SLICES="$(lipo -archs "$APP/Contents/MacOS/tianji-sizhu")"
case "$SLICES" in *"$MACHO_ARCH"*) ok "slice: $SLICES (go arch $ARCH)" ;; *) die "slice '$SLICES' lacks $MACHO_ARCH (go arch $ARCH)" 1 ;; esac

codesign --verify --deep --strict "$APP" || die "signature invalid" 1
SIG="$(codesign -dv --verbose=4 "$APP" 2>&1 | grep -E '^Signature=' || true)"
ok "${SIG:-Signature=unknown}"

if [ -n "$VER" ]; then
  BUNDLE_VER="$(plutil -extract CFBundleShortVersionString raw "$APP/Contents/Info.plist")"
  [ "$BUNDLE_VER" = "$VER" ] || die "CFBundleShortVersionString=$BUNDLE_VER expected $VER" 1
  ok "CFBundleShortVersionString=$BUNDLE_VER"
fi

# spctl is expected to FAIL without notarisation; record it, never block on it.
SPCTL="$(spctl -a -vv "$APP" 2>&1 || true)"
warn "Gatekeeper: ${SPCTL:-<no output>} (expected unsigned/adhoc)"

# Launch from a writable copy: running from a read-only mount would fail on
# data dir creation for reasons unrelated to the product.
TMPRUN="$RELEASE_ROOT/.tmp/run-$ARCH"
rm -rf "$TMPRUN"; mkdir -p "$TMPRUN"
cp -R "$APP" "$TMPRUN/"
"$TMPRUN/tianji-sizhu.app/Contents/MacOS/tianji-sizhu" >/dev/null 2>&1 &
PID=$!
sleep 5
if ! kill -0 "$PID" 2>/dev/null; then
  die "app exited within 5s" 1
fi
ok "app alive after 5s (pid=$PID)"
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true
rm -rf "$TMPRUN"

hdiutil detach "$MNT" -force >/dev/null 2>&1 || true
if mount | grep -q "$MNT"; then
  die "mount residue detected at $MNT" 1
fi
ok "no mount residue"
ok "PASS"
