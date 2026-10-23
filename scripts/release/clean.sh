#!/usr/bin/env bash
# Release cleaner. Only touches generated paths - never sources or user data.
#
#   clean.sh [--dry-run] [--all]
#
# Whitelist:
#   default : build/bin, frontend/dist, .tmp/release, .tmp/cleanroom, .tmp/spike, *.syso
#   --all   : also frontend/node_modules, .cache/pnpm, .cache/go-build, .cache/go-mod
# Never removed: .git, data/, tasks/, docs/, frontend/src, internal/, build/ (resources)
set -euo pipefail

source "$(dirname "$0")/lib.sh"

DRY=0
ALL=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --all) ALL=1; shift ;;
    -h|--help) echo "usage: clean.sh [--dry-run] [--all]"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

TARGETS=(
  "$RELEASE_ROOT/build/bin"
  "$RELEASE_ROOT/frontend/dist"
  "$RELEASE_ROOT/.tmp/release"
  "$RELEASE_ROOT/.tmp/cleanroom"
  "$RELEASE_ROOT/.tmp/spike"
  "$RELEASE_ROOT/.tmp/nsis-extract"
  "$RELEASE_ROOT/tianji-sizhu-res.syso"
  # Stray output from a mis-rooted asset script (CHG-004 TRACEABILITY D3).
  # Harmless to git (ignored) but confusing on disk; keep it cleanable.
  "$RELEASE_ROOT/frontend/frontend"
)

if [ "$ALL" = "1" ]; then
  TARGETS+=(
    "$RELEASE_ROOT/frontend/node_modules"
    "$RELEASE_ROOT/.cache/pnpm"
    "$RELEASE_ROOT/.cache/npm"
    "$RELEASE_ROOT/.cache/go-build"
    "$RELEASE_ROOT/.cache/go-mod"
  )
fi

log "targets:"
for t in "${TARGETS[@]}"; do
  if [ -e "$t" ]; then
    printf '  remove  %s\n' "${t#$RELEASE_ROOT/}"
  else
    printf '  skip    %s (absent)\n' "${t#$RELEASE_ROOT/}"
  fi
done

if [ "$DRY" = "1" ]; then
  log "dry run: nothing removed"
  exit 0
fi

for t in "${TARGETS[@]}"; do
  [ -e "$t" ] || continue
  rm -rf -- "$t"
done

log "cleaned"
