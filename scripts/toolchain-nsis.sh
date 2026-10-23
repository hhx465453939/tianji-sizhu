#!/usr/bin/env bash
# TianJi-SiZhu - bootstrap NSIS (makensis) into the project-local toolchain.
#
# Wails silently skips installer generation when makensis is absent
# (nsis_installer.go returns nil), which is how "successful" builds end up
# without a setup.exe. This script guarantees the tool exists where we expect.
#
# Idempotent. Installs only into <root>/.toolchain/nsis. No global paths touched.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NSIS_VERSION="${NSIS_VERSION:-3.10}"
DEST="$ROOT/.toolchain/nsis"
DL_DIR="$ROOT/.tmp"
ZIP="$DL_DIR/nsis-${NSIS_VERSION}.zip"

_mixed() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi
}

if [ -x "$DEST/makensis" ] || [ -f "$DEST/makensis.exe" ]; then
  echo "[nsis] already present: $DEST"
  exit 0
fi

mkdir -p "$DEST" "$DL_DIR"
echo "[nsis] downloading NSIS $NSIS_VERSION"
rm -f "$ZIP"
curl -fL --retry 3 --connect-timeout 20 \
  "https://downloads.sourceforge.net/project/nsis/NSIS%203/${NSIS_VERSION}/nsis-${NSIS_VERSION}.zip" \
  -o "$(_mixed "$ZIP")"

echo "[nsis] extracting"
rm -rf "$DL_DIR/nsis-extract"
mkdir -p "$DL_DIR/nsis-extract"
unzip -q "$ZIP" -d "$DL_DIR/nsis-extract"

# The archive contains a single top-level directory (nsis-3.10/).
SRC="$(find "$DL_DIR/nsis-extract" -maxdepth 1 -mindepth 1 -type d | head -1)"
if [ -z "$SRC" ]; then
  echo "[nsis] unexpected archive layout"; exit 1
fi
cp -r "$SRC"/. "$DEST"/
rm -f "$ZIP"

if [ -x "$DEST/makensis" ] || [ -f "$DEST/makensis.exe" ]; then
  echo "[nsis] installed: $DEST"
else
  echo "[nsis] makensis missing after extract"; exit 1
fi
