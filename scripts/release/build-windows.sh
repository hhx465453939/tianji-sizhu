#!/usr/bin/env bash
# Build one Windows architecture: application exe + NSIS installer.
#
#   build-windows.sh --arch amd64|arm64 [--skip-frontend] [--no-nsis]
#
# Artifacts land in .tmp/release/<version>/ with the ADR-001 naming scheme.
# Exit: 0 ok | 1 check failed | 2 precondition failed | 3 build failed
set -euo pipefail

source "$(dirname "$0")/lib.sh"

ARCH=""
SKIP_FRONTEND=0
NO_NSIS=0

usage() {
  cat <<'USAGE'
usage: build-windows.sh --arch <amd64|arm64> [options]

  --arch <arch>      target architecture (required)
  --skip-frontend    reuse the existing frontend/dist (assumes it is current)
  --no-nsis          skip installer generation (app binary only)
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --arch) ARCH="${2:-}"; shift 2 ;;
    --skip-frontend) SKIP_FRONTEND=1; shift ;;
    --no-nsis) NO_NSIS=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[ "$ARCH" = "amd64" ] || [ "$ARCH" = "arm64" ] || die "--arch must be amd64 or arm64" 2

# Host policy (SPEC F2): the Windows backend has no CGO, so Linux can
# cross-compile Windows reliably. macOS is not a supported host for Windows
# targets (no mingw/nsis toolchain by default).
case "$(uname -s)" in
  Darwin) die "build Windows artifacts on Windows or Linux, not macOS" 2 ;;
esac

require_cmd go
require_cmd wails
require_cmd node

# Wails' Windows backend is pure Go; keep CGO off so cross-compilation is safe.
export CGO_ENABLED=0

VERSION="$(read_version)"
assert_semver "$VERSION"
ensure_go_caches
ensure_nsis_on_path

if [ "$NO_NSIS" != "1" ]; then
  # Precondition, not a warning: Wails returns nil (and silently skips the
  # installer) when makensis is missing, which is exactly failure mode B5.
  # Windows uses the project-local copy; Linux CI uses the distro package.
  command -v makensis >/dev/null 2>&1 || \
    die "makensis not found - run scripts/toolchain-nsis.sh (or apt-get install nsis)" 2
fi

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

log "wails build windows/$ARCH (nsis=$([ "$NO_NSIS" = "1" ] && echo no || echo yes))"
WAILS_ARGS=(-platform "windows/$ARCH" -s)
[ "$NO_NSIS" = "1" ] || WAILS_ARGS+=(-nsis)
( cd "$RELEASE_ROOT" && wails build "${WAILS_ARGS[@]}" ) >/dev/null || die "wails build failed" 3

# --- application binary -------------------------------------------------
EXE_SRC="$RELEASE_ROOT/build/bin/tianji-sizhu.exe"
[ -f "$EXE_SRC" ] || die "expected app binary missing: $EXE_SRC" 3

APP_DEST="$OUT/tianji-sizhu-$VERSION-windows-$ARCH.exe"
cp "$EXE_SRC" "$APP_DEST"

MACHINE="$(pe_machine "$APP_DEST")"
EXPECT="0x8664"; [ "$ARCH" = "arm64" ] && EXPECT="0xAA64"
[ "$MACHINE" = "$EXPECT" ] || die "PE machine mismatch: got $MACHINE, expected $EXPECT" 1
ok "app: $(basename "$APP_DEST")  $(file_bytes "$APP_DEST") bytes  PE=$MACHINE"

# --- installer ----------------------------------------------------------
if [ "$NO_NSIS" != "1" ]; then
  INST_SRC="$RELEASE_ROOT/build/bin/tianji-sizhu-$ARCH-installer.exe"
  [ -f "$INST_SRC" ] || die "installer missing: Wails skipped NSIS (B5)" 3

  SETUP_DEST="$OUT/tianji-sizhu-$VERSION-windows-$ARCH-setup.exe"
  cp "$INST_SRC" "$SETUP_DEST"
  # The NSIS stub itself is a 32-bit host binary; the payload carries the arch.
  # So we assert presence + size + version, never the stub's PE machine.
  ok "setup: $(basename "$SETUP_DEST")  $(file_bytes "$SETUP_DEST") bytes"
fi

log "done ($ARCH) -> $OUT"
