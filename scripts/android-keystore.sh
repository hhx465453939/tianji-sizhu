#!/usr/bin/env bash
# Create a project-local debug keystore so AGP never writes to $HOME/.android.
# Idempotent: skips when the keystore already exists.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/android-env.sh" >/dev/null

KEYSTORE_DIR="$ROOT/.android/home"
KEYSTORE="$KEYSTORE_DIR/debug.keystore"

mkdir -p "$KEYSTORE_DIR"

if [ -f "$KEYSTORE" ]; then
  echo "[keystore] exists: $KEYSTORE"
  exit 0
fi

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/keytool" ]; then
  if command -v keytool >/dev/null 2>&1; then
    KEYTOOL="keytool"
  else
    echo "[keystore] keytool not found (set JAVA_HOME)"; exit 1
  fi
else
  KEYTOOL="$JAVA_HOME/bin/keytool"
fi

echo "[keystore] generating local debug keystore"
"$KEYTOOL" -genkeypair -v \
  -keystore "$KEYSTORE" \
  -storepass android -keypass android \
  -alias androiddebugkey \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1

echo "[keystore] created: $KEYSTORE"
