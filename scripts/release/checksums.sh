#!/usr/bin/env bash
# Generate SHA256SUMS-<version>.txt for every artifact in the release directory.
#
#   checksums.sh [--dist <dir>]
set -euo pipefail

source "$(dirname "$0")/lib.sh"

DIST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dist) DIST="${2:-}"; shift 2 ;;
    -h|--help) echo "usage: checksums.sh [--dist <dir>]"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

VERSION="$(read_version)"
[ -n "$DIST" ] || DIST="$RELEASE_ROOT/.tmp/release/$VERSION"
[ -d "$DIST" ] || die "dist directory not found: $DIST" 2

SUMS="$DIST/SHA256SUMS-$VERSION.txt"
: > "$SUMS"

COUNT=0
# Only the 8 deliverables (SPEC §3.1): win setups, win portables, mac .pkg
# installers and mac .app zips. Intermediate bare binaries are excluded.
for f in "$DIST"/*-setup.exe "$DIST"/*-portable.zip "$DIST"/*-installer.pkg "$DIST"/*-app.zip; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in SHA256SUMS-*) continue ;; esac
  printf '%s  %s\n' "$(sha256_of "$f")" "$(basename "$f")" >> "$SUMS"
  COUNT=$((COUNT + 1))
done

[ "$COUNT" -gt 0 ] || die "no artifacts found in $DIST" 1
ok "wrote $(basename "$SUMS") with $COUNT entries"
cat "$SUMS"
