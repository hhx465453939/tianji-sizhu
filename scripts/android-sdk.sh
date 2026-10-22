#!/usr/bin/env bash
# TianJi-SiZhu - bootstrap the project-local Android SDK (idempotent).
#
# Installs only into .android/sdk. No global paths are touched.
# Usage:
#   bash scripts/android-sdk.sh            # cmdline-tools + platform-tools only
#   bash scripts/android-sdk.sh 35 35.0.0  # also install platform 35 + build-tools
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/android-env.sh" >/dev/null

CMDLINE_VERSION="${CMDLINE_VERSION:-13114758}"
SDK="$ROOT/.android/sdk"
DL_DIR="$ROOT/.tmp"
ZIP="$DL_DIR/cmdline-tools.zip"

# Pick the host-appropriate commandline-tools bundle.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) CMDLINE_OS="win" ;;
  Darwin)               CMDLINE_OS="mac" ;;
  *)                    CMDLINE_OS="linux" ;;
esac

# Windows curl needs a native path; MSYS tools (unzip) need the /e/... form.
_mixed() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi
}
ZIP_NATIVE="$(_mixed "$ZIP")"

mkdir -p "$SDK/cmdline-tools" "$DL_DIR"

if [ ! -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ] && \
   [ ! -f "$SDK/cmdline-tools/latest/bin/sdkmanager.bat" ]; then
  echo "[sdk] downloading commandline-tools $CMDLINE_VERSION ($CMDLINE_OS)"
  rm -f "$ZIP"
  curl -fL --retry 3 --connect-timeout 20 \
    "https://dl.google.com/android/repository/commandlinetools-${CMDLINE_OS}-${CMDLINE_VERSION}_latest.zip" \
    -o "$ZIP_NATIVE"
  echo "[sdk] extracting"
  rm -rf "$SDK/cmdline-tools/tmp-extract"
  mkdir -p "$SDK/cmdline-tools/tmp-extract"
  unzip -q "$ZIP" -d "$SDK/cmdline-tools/tmp-extract"
  rm -rf "$SDK/cmdline-tools/latest"
  mv "$SDK/cmdline-tools/tmp-extract/cmdline-tools" "$SDK/cmdline-tools/latest"
  rmdir "$SDK/cmdline-tools/tmp-extract" 2>/dev/null || true
  rm -f "$ZIP"
fi

SDKMANAGER="$SDK/cmdline-tools/latest/bin/sdkmanager"
if [ -f "${SDKMANAGER}.bat" ]; then SDKMANAGER="${SDKMANAGER}.bat"; fi
[ -f "$SDKMANAGER" ] || { echo "[sdk] sdkmanager missing"; exit 1; }

# Non-Windows hosts need the JVM on PATH; CI images usually export JAVA_HOME already.
if [ "$CMDLINE_OS" != "win" ] && [ -n "${JAVA_HOME:-}" ]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "[sdk] accepting licenses"
yes | "$SDKMANAGER" --sdk_root="$(_mixed "$SDK")" --licenses >/dev/null 2>&1 || true

PACKAGES=("platform-tools")
if [ "${1:-}" != "" ]; then
  PACKAGES+=("platforms;android-$1")
fi
if [ "${2:-}" != "" ]; then
  PACKAGES+=("build-tools;$2")
fi

echo "[sdk] installing: ${PACKAGES[*]}"
"$SDKMANAGER" --sdk_root="$(_mixed "$SDK")" "${PACKAGES[@]}"

echo "[sdk] done. Contents:"
ls -1 "$SDK"
