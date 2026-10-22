#!/usr/bin/env bash
# TianJi-SiZhu - Android virtual environment (project-local, never global).
# Source this file before any Android command:
#   source scripts/android-env.sh
#
# Every path resolves inside the repository, per AGENTS.md governance.
# Removing .android/ leaves the host machine untouched.

set -uo pipefail

_THIS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export TIANJI_ROOT="$(cd "$_THIS/.." && pwd)"

# Prefer mixed paths (E:/...) so both bash tools and the JVM/Gradle understand them.
_mixed() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi
}

export TIANJI_ANDROID_HOME="$TIANJI_ROOT/.android"

export ANDROID_HOME="$(_mixed "$TIANJI_ANDROID_HOME/sdk")"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export GRADLE_USER_HOME="$(_mixed "$TIANJI_ANDROID_HOME/gradle-home")"
export ANDROID_AVD_HOME="$(_mixed "$TIANJI_ANDROID_HOME/avd")"
export ANDROID_USER_HOME="$(_mixed "$TIANJI_ANDROID_HOME/home")"
export ANDROID_EMULATOR_HOME="$(_mixed "$TIANJI_ANDROID_HOME/emulator")"

# Windows-hosted tools (adb, emulator) resolve their config via %USERPROFILE%.
# Redirect it so adb keys / avd indexes never land in the real user profile.
# HOME is intentionally left alone: bash path expansion (~) stays native.
export USERPROFILE="$(_mixed "$TIANJI_ANDROID_HOME/home")"
mkdir -p "$TIANJI_ANDROID_HOME/home/.android"

# Keep every cache/temp inside the project as well.
export XDG_CACHE_HOME="$(_mixed "$TIANJI_ROOT/.cache")"
export TMPDIR="$(_mixed "$TIANJI_ROOT/.tmp")"
export TEMP="$(_mixed "$TIANJI_ROOT/.tmp")"
export TMP="$(_mixed "$TIANJI_ROOT/.tmp")"

mkdir -p "$ANDROID_HOME" "$GRADLE_USER_HOME" "$ANDROID_AVD_HOME" \
         "$ANDROID_USER_HOME" "$ANDROID_EMULATOR_HOME" "$XDG_CACHE_HOME" "$TMPDIR"

case ":$PATH:" in
  *":$ANDROID_HOME/platform-tools:"*) ;;
  *) export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH" ;;
esac

# Gradle defaults tuned for a modest CI runner; override via GRADLE_OPTS when
# the host has more headroom (this repo's dev box has 18 cores / 128 GB).
export GRADLE_OPTS="${GRADLE_OPTS:--Dorg.gradle.daemon=false -Dorg.gradle.jvmargs=-Xmx3g -Dorg.gradle.parallel=false}"

echo "[android-env] ANDROID_HOME=$ANDROID_HOME"
echo "[android-env] GRADLE_USER_HOME=$GRADLE_USER_HOME"
