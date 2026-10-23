#!/usr/bin/env bash
# Local release orchestration - mirrors the CI job order so "works locally"
# and "works in CI" mean the same thing.
#
#   release.sh [--windows-only|--macos-only|--auto] [--skip-tests] [--skip-smoke] [--dry-run]
#
# Steps: version check -> L1 tests -> build (per arch) -> portable ->
#        verify-artifacts -> checksums -> L3/L4 smoke
set -euo pipefail

source "$(dirname "$0")/lib.sh"

MODE="auto"
SKIP_TESTS=0
SKIP_SMOKE=0
DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --windows-only) MODE="windows"; shift ;;
    --macos-only) MODE="macos"; shift ;;
    --auto) MODE="auto"; shift ;;
    --skip-tests) SKIP_TESTS=1; shift ;;
    --skip-smoke) SKIP_SMOKE=1; shift ;;
    --dry-run) DRY=1; shift ;;
    -h|--help)
      cat <<'USAGE'
usage: release.sh [--windows-only|--macos-only|--auto] [--skip-tests] [--skip-smoke] [--dry-run]

  --auto          build for the current host (Windows -> win amd64+arm64, macOS -> mac amd64+arm64)
  --skip-tests    skip L1 (go test / vitest / tsc)
  --skip-smoke    skip install/launch lifecycle tests
  --dry-run       print the plan without executing
USAGE
      exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

VERSION="$(read_version)"
OUT="$RELEASE_ROOT/.tmp/release/$VERSION"

HOST="$(uname -s)"
case "$HOST" in
  MINGW*|MSYS*|CYGWIN*) HOST_OS="windows" ;;
  Darwin)               HOST_OS="macos" ;;
  *)                    HOST_OS="linux" ;;
esac
[ "$MODE" = "auto" ] && MODE="$HOST_OS"

log "version=$VERSION host=$HOST_OS mode=$MODE"

if [ "$DRY" = "1" ]; then
  log "plan:"
  echo "  1. version.sh check"
  [ "$SKIP_TESTS" = "1" ] || echo "  2. L1: go test ./... + vitest + tsc"
  case "$MODE" in
    windows) echo "  3. build-windows.sh --arch amd64"
             echo "  4. build-windows.sh --arch arm64" ;;
    macos)   echo "  3. build-macos.sh --arch arm64"
             echo "  4. build-macos.sh --arch amd64" ;;
    *)       echo "  3. (unsupported host for packaging)"; exit 2 ;;
  esac
  echo "  5. package-portable.sh (both archs)"
  echo "  6. verify-artifacts.sh"
  echo "  7. checksums.sh"
  [ "$SKIP_SMOKE" = "1" ] || echo "  8. smoke (L3 windows / L4 macos)"
  exit 0
fi

# 1. version consistency
bash "$RELEASE_ROOT/scripts/release/version.sh" check

# 2. L1 tests
if [ "$SKIP_TESTS" != "1" ]; then
  log "L1: go test"
  ensure_go_caches
  ( cd "$RELEASE_ROOT" && go test ./... >/dev/null ) || die "go test failed" 1

  log "L1: frontend typecheck + unit tests"
  ( cd "$RELEASE_ROOT/frontend" && npx tsc --noEmit ) || die "tsc failed" 1
  ( cd "$RELEASE_ROOT/frontend" && npx vitest run >/dev/null ) || die "vitest failed" 1
  ok "L1 passed"
fi

mkdir -p "$OUT"

# 3-4. builds
case "$MODE" in
  windows)
    bash "$RELEASE_ROOT/scripts/release/build-windows.sh" --arch amd64 || exit $?
    bash "$RELEASE_ROOT/scripts/release/build-windows.sh" --arch arm64 || exit $?
    ;;
  macos)
    # Native arm64 first, then cross-compile amd64 (mirrors Wails' universal path).
    bash "$RELEASE_ROOT/scripts/release/build-macos.sh" --arch arm64 || exit $?
    bash "$RELEASE_ROOT/scripts/release/build-macos.sh" --arch amd64 || exit $?
    ;;
  *)
    die "host '$HOST_OS' cannot produce native packages (use CI)" 2 ;;
esac

# 5. portable archives (Windows only; macOS ships a signed .app zip)
if [ "$MODE" = "windows" ]; then
  for arch in amd64 arm64; do
    bash "$RELEASE_ROOT/scripts/release/package-portable.sh" --os windows --arch "$arch" || exit $?
  done
fi

# 6. verification + manifest
bash "$RELEASE_ROOT/scripts/release/verify-artifacts.sh" || exit $?

# 7. checksums
bash "$RELEASE_ROOT/scripts/release/checksums.sh"

# 8. lifecycle smoke
if [ "$SKIP_SMOKE" != "1" ]; then
  if [ "$MODE" = "windows" ]; then
    command -v pwsh >/dev/null 2>&1 && PS="pwsh" || PS="powershell"
    "$PS" -NoProfile -ExecutionPolicy Bypass -File \
      "$RELEASE_ROOT/scripts/release/smoke-windows.ps1" \
      -Installer "$OUT/tianji-sizhu-$VERSION-windows-amd64-setup.exe" \
      -ExpectVersion "$VERSION" -ExpectArch amd64 || true
  else
    bash "$RELEASE_ROOT/scripts/release/smoke-macos.sh" \
      --dmg "$OUT/tianji-sizhu-$VERSION-macos-arm64.dmg" \
      --expect-arch arm64 --expect-version "$VERSION" || true
  fi
fi

log "release artifacts ready in $OUT"
