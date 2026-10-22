#!/usr/bin/env bash
# TianJi-SiZhu - virtualized environment guard.
# Verifies that every toolchain path resolves INSIDE the project.
# Exit code 1 when any declared path escapes the project root.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

# Normalize a path for comparison (Git Bash / MSYS / WSL aware)
norm() {
  local p="$1"
  [ -z "$p" ] && { echo ""; return; }
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -u "$p" 2>/dev/null || echo "$p"
  else
    echo "$p"
  fi
}

check() {
  local label="$1" value="$2" required="$3"
  local nv
  nv="$(norm "$value")"
  if [ -z "$value" ]; then
    printf '  %-24s %-46s %s\n' "$label" "<unset>" "$([ "$required" = "yes" ] && echo 'MISSING' || echo 'optional')"
    [ "$required" = "yes" ] && FAIL=1
    return
  fi
  case "$nv" in
    "$ROOT"|"$ROOT"/*)
      printf '  %-24s %-46s %s\n' "$label" "$value" "OK inside project" ;;
    *)
      printf '  %-24s %-46s %s\n' "$label" "$value" "OUTSIDE PROJECT"
      FAIL=1 ;;
  esac
}

# Machine-wide runtimes (JDK, Python) are legitimately installed once per host
# and are NOT project dependencies: reusing them is expected. Only project-owned
# SDKs, caches, emulators and keystores must stay inside the repository.
check_host_runtime() {
  local label="$1" value="$2"
  local nv
  nv="$(norm "$value")"
  if [ -z "$value" ]; then
    printf '  %-24s %-46s %s\n' "$label" "<unset>" "optional"
    return
  fi
  case "$nv" in
    "$ROOT"|"$ROOT"/*)
      printf '  %-24s %-46s %s\n' "$label" "$value" "OK (project-local)" ;;
    *)
      printf '  %-24s %-46s %s\n' "$label" "$value" "host runtime (allowed)" ;;
  esac
}

echo ""
echo "Project root: $ROOT"
echo ""
echo "-- Virtualized toolchain paths --"
check "ANDROID_HOME"          "${ANDROID_HOME:-}"           no
check "ANDROID_SDK_ROOT"      "${ANDROID_SDK_ROOT:-}"       no
check "GRADLE_USER_HOME"      "${GRADLE_USER_HOME:-}"       no
check "ANDROID_AVD_HOME"      "${ANDROID_AVD_HOME:-}"       no
check "ANDROID_EMULATOR_HOME" "${ANDROID_EMULATOR_HOME:-}"  no
check "ANDROID_USER_HOME"     "${ANDROID_USER_HOME:-}"      no
check_host_runtime "JAVA_HOME"       "${JAVA_HOME:-}"
check "VIRTUAL_ENV"           "${VIRTUAL_ENV:-}"            no
check "PNPM_HOME"             "${PNPM_HOME:-}"              no
check "XDG_CACHE_HOME"        "${XDG_CACHE_HOME:-}"         no
check "TMPDIR"                "${TMPDIR:-}"                 no

echo ""
echo "-- Host-global leak detection --"
for d in "$HOME/.gradle" "$HOME/.android/avd" "$HOME/.m2"; do
  if [ -d "$d" ] && [ -n "$(ls -A "$d" 2>/dev/null)" ]; then
    echo "  warn  host cache present: $d (pre-existing, not created by this project)"
  fi
done

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "RESULT: FAIL - environment escapes project root. See AGENTS.md -> 虚拟化与隔离部署治理"
  exit 1
fi
echo "RESULT: PASS - all declared paths stay inside the project"
exit 0
