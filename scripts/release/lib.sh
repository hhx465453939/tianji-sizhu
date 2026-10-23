#!/usr/bin/env bash
# Shared helpers for scripts/release/*. Sourced, never executed directly.
#
# Conventions:
#   exit 0 success | 1 check failed | 2 precondition failed (do not retry) | 3 build failed

RELEASE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION_FILE="$RELEASE_ROOT/VERSION"

log()  { printf '[release] %s\n' "$*"; }
warn() { printf '[release] WARN: %s\n' "$*" >&2; }
ok()   { printf '[release] OK: %s\n' "$*"; }
die()  { printf '[release] ERROR: %s\n' "$*" >&2; exit "${2:-1}"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1" 2
}

# host_guard <windows|macos|linux>
host_guard() {
  local expected="$1" actual
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*) actual="windows" ;;
    Darwin)               actual="macos" ;;
    *)                    actual="linux" ;;
  esac
  [ "$actual" = "$expected" ] || die "this script must run on $expected (host is $actual)" 2
}

read_version() {
  [ -f "$VERSION_FILE" ] || die "VERSION file missing at $VERSION_FILE" 2
  tr -d '[:space:]' < "$VERSION_FILE"
}

assert_semver() {
  local v="$1"
  [[ "$v" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "VERSION must be X.Y.Z (no 'v' prefix), got '$v'" 1
}

# read_json <file> <dotted.path>  -> prints value or empty
read_json() {
  node -e '
    const fs = require("fs");
    const [file, path] = process.argv.slice(1);
    let cur;
    try { cur = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { process.exit(2); }
    for (const k of path.split(".")) {
      if (cur == null || typeof cur !== "object") { cur = undefined; break; }
      cur = cur[k];
    }
    if (cur !== undefined && cur !== null) process.stdout.write(String(cur));
  ' "$1" "$2"
}

# Ensure the project-local NSIS is on PATH (Wails silently skips setup.exe otherwise).
ensure_nsis_on_path() {
  local nsis="$RELEASE_ROOT/.toolchain/nsis"
  if [ -x "$nsis/makensis" ] || [ -f "$nsis/makensis.exe" ]; then
    case ":$PATH:" in
      *":$nsis:"*) ;;
      *) export PATH="$nsis:$PATH" ;;
    esac
  fi
}

# Redirect Go caches into the repo (AGENTS.md isolation rule).
ensure_go_caches() {
  export GOCACHE="$RELEASE_ROOT/.cache/go-build"
  export GOMODCACHE="$RELEASE_ROOT/.cache/go-mod"
  export GOBIN="$RELEASE_ROOT/.toolchain/bin"
  export TMPDIR="$RELEASE_ROOT/.tmp"
  mkdir -p "$GOCACHE" "$GOMODCACHE" "$GOBIN" "$TMPDIR"
}

# Byte size of a file, portable across GNU/BSD/MSYS.
file_bytes() {
  wc -c < "$1" | tr -d ' '
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

# pe_machine <exe> -> prints "0x8664" (amd64) / "0xAA64" (arm64) / "0x014C" (i386)
pe_machine() {
  python -c '
import struct, sys
p = sys.argv[1]
with open(p, "rb") as f:
    f.seek(0x3c)
    off = struct.unpack("<I", f.read(4))[0]
    f.seek(off + 4)
    print("0x%04X" % struct.unpack("<H", f.read(2))[0])
' "$1"
}
