#!/usr/bin/env bash
# TianJi-SiZhu - one-shot Android build.
#
#   ./scripts/android-build.sh            # build every ABI + universal
#   ./scripts/android-build.sh arm64-v8a  # copy only one ABI out
#   SKIP_WEB=1 ./scripts/android-build.sh # reuse existing dist/
#
# Everything (SDK, Gradle cache, keystore, temp) stays inside the repo.
# Output: release/tianji-sizhu-<version>-android-<abi>.apk
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/android-env.sh"

ONLY_ABI="${1:-}"
SKIP_WEB="${SKIP_WEB:-0}"

VERSION="$(cd "$ROOT/frontend" && node -p "require('./package.json').version")"
echo "[android] version $VERSION"

# 1. SDK present?
if [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
  echo "[android] SDK missing -> bootstrapping"
  bash "$ROOT/scripts/android-sdk.sh" 36 36.0.0
fi

# 2. Local debug keystore (never $HOME/.android)
bash "$ROOT/scripts/android-keystore.sh"

# 3. Web build -> dist/  (pnpm locally, npm on CI images without pnpm)
if [ "$SKIP_WEB" != "1" ]; then
  echo "[android] building web bundle"
  if command -v pnpm >/dev/null 2>&1; then
    ( cd "$ROOT/frontend" && pnpm build )
  else
    ( cd "$ROOT/frontend" && npm run build )
  fi
fi

# 4. Copy web assets + plugin config into the native project
echo "[android] cap sync"
( cd "$ROOT/frontend" && npx cap sync android )

# 5. Gradle assembleRelease (splits produce per-ABI + universal)
echo "[android] gradle assembleRelease"
# Pick the wrapper by HOST, not by file presence: gradlew.bat exists everywhere
# but is not executable on Linux, and gradlew usually lacks the exec bit in git.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) GRADLEW="./gradlew.bat" ;;
  *) chmod +x "$ROOT/frontend/android/gradlew" 2>/dev/null || true; GRADLEW="./gradlew" ;;
esac
( cd "$ROOT/frontend/android" && $GRADLEW assembleRelease --no-daemon --max-workers=2 )

# 6. Normalize artifact names
OUT_DIR="$ROOT/release"
mkdir -p "$OUT_DIR"
APK_DIR="$ROOT/frontend/android/app/build/outputs/apk/release"
COUNT=0
for apk in "$APK_DIR"/*.apk; do
  [ -e "$apk" ] || continue
  base="$(basename "$apk")"
  abi="$(echo "$base" | sed -E 's/^app-(.*)-release\.apk$/\1/')"
  if [ "$abi" != "universal" ] && [ -n "$ONLY_ABI" ] && [ "$abi" != "$ONLY_ABI" ]; then
    continue
  fi
  dest="$OUT_DIR/tianji-sizhu-${VERSION}-android-${abi}.apk"
  cp "$apk" "$dest"
  COUNT=$((COUNT + 1))
  echo "  -> $(basename "$dest")  ($(du -h "$dest" | cut -f1))"
done

echo "[android] $COUNT apk(s) in release/"
