#!/usr/bin/env bash
# TianJi-SiZhu - Go toolchain virtualisation.
# Source before any Go build/test so module, build and binary caches stay
# inside the repository (AGENTS.md isolation rule; CHG-004 B8).
#
#   source scripts/go-env.sh
#   go test ./...
#
# Without this, Go writes to %LOCALAPPDATA%\go-build and %USERPROFILE%\go\pkg\mod,
# which escapes the project and breaks the "delete the repo, host is clean" claim.

set -uo pipefail

_THIS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export TIANJI_ROOT="$(cd "$_THIS/.." && pwd)"

_mixed() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi
}

export GOCACHE="$(_mixed "$TIANJI_ROOT/.cache/go-build")"
export GOMODCACHE="$(_mixed "$TIANJI_ROOT/.cache/go-mod")"
export GOBIN="$(_mixed "$TIANJI_ROOT/.toolchain/bin")"
export TMPDIR="$(_mixed "$TIANJI_ROOT/.tmp")"

mkdir -p "$GOCACHE" "$GOMODCACHE" "$GOBIN" "$TMPDIR"

# Project-local NSIS (Wails silently skips setup.exe when makensis is absent).
if [ -x "$TIANJI_ROOT/.toolchain/nsis/makensis" ] || [ -f "$TIANJI_ROOT/.toolchain/nsis/makensis.exe" ]; then
  case ":$PATH:" in
    *":$TIANJI_ROOT/.toolchain/nsis:"*) ;;
    *) export PATH="$TIANJI_ROOT/.toolchain/nsis:$PATH" ;;
  esac
fi

echo "[go-env] GOCACHE=$GOCACHE"
echo "[go-env] GOMODCACHE=$GOMODCACHE"
