#!/usr/bin/env bash
# Verify release artifacts and emit artifacts-manifest.json (SPEC §3.2).
#
#   verify-artifacts.sh [--dist <dir>] [--allow-partial]
#
# --allow-partial : don't fail when an expected platform/arch is absent
#                   (used by local Windows-only builds; CI omits it).
#
# Exit: 0 all checks pass | 1 check failed
set -euo pipefail

source "$(dirname "$0")/lib.sh"

DIST=""
ALLOW_PARTIAL=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dist) DIST="${2:-}"; shift 2 ;;
    --allow-partial) ALLOW_PARTIAL=1; shift ;;
    -h|--help) echo "usage: verify-artifacts.sh [--dist <dir>] [--allow-partial]"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

VERSION="$(read_version)"
[ -n "$DIST" ] || DIST="$RELEASE_ROOT/.tmp/release/$VERSION"
[ -d "$DIST" ] || die "dist directory not found: $DIST" 2

TSV="$(mktemp)"
trap 'rm -f "$TSV"' EXIT
FAIL=0
MISSING=""
HOST_OS="$(uname -s)"

# Emit one manifest row. Args: file os arch kind expect
emit() {
  local file="$1" os="$2" arch="$3" kind="$4"
  local path="$DIST/$file"
  local bytes sha checks archcheck versioncheck smoke

  if [ ! -f "$path" ]; then
    warn "missing artifact: $file"
    MISSING="$MISSING $file"
    FAIL=1
    return
  fi

  bytes="$(file_bytes "$path")"
  sha="$(sha256_of "$path")"

  # --- size gate (SPEC §6) ---
  local limit=30000000
  case "$kind" in
    setup)    limit=28000000 ;;
    portable) limit=22000000 ;;
    appzip)   limit=30000000 ;;
    dmg)      limit=30000000 ;;
    app)      limit=30000000 ;;
  esac

  if [ "$bytes" -le 0 ] || [ "$bytes" -gt "$limit" ]; then
    warn "$file size $bytes outside (0, $limit]"
    FAIL=1
  fi

  # --- architecture gate ---
  archcheck="skip:not-applicable"
  if [ "$os" = "windows" ] && [ "$kind" = "app" ]; then
    if [ "$HOST_OS" = "Linux" ] || [[ "$HOST_OS" == MINGW* ]] || [[ "$HOST_OS" == MSYS* ]]; then
      local m expect="0x8664"
      [ "$arch" = "arm64" ] && expect="0xAA64"
      m="$(pe_machine "$path" 2>/dev/null || echo "n/a")"
      if [ "$m" = "$expect" ]; then archcheck="pe:$m"; else
        warn "$file PE=$m expected $expect"; archcheck="pe:MISMATCH($m)"; FAIL=1
      fi
    else
      archcheck="skip:no-pe-reader"
    fi
  elif [ "$os" = "windows" ] && [ "$kind" = "setup" ]; then
    # NSIS stub is always 32-bit; assert the arch token in the name instead.
    case "$file" in *"-$arch-setup.exe") archcheck="name:$arch" ;; *) archcheck="name:MISMATCH"; FAIL=1 ;; esac
  elif [ "$os" = "macos" ]; then
    if [ "$HOST_OS" = "Darwin" ]; then
      local slice
      slice="$(lipo -archs "$path" 2>/dev/null || true)"
      if [ -z "$slice" ]; then archcheck="skip:not-macho"; else
        macho_want="$(macho_arch "$arch")"
        archcheck="macho:$slice"
        case "$slice" in *"$macho_want"*) ;; *) warn "$file slice '$slice' lacks $macho_want (go arch $arch)"; FAIL=1 ;; esac
      fi
    else
      archcheck="skip:needs-darwin"
    fi
  fi

  # --- version gate (Windows PE resources only; zip/dmg carry no version) ---
  versioncheck="skip:not-a-pe"
  if [ "$os" = "windows" ] && { [ "$kind" = "app" ] || [ "$kind" = "setup" ]; } && { [[ "$HOST_OS" == MINGW* ]] || [[ "$HOST_OS" == MSYS* ]]; }; then
    local fv
    fv="$(powershell -NoProfile -Command "\$v=[System.Diagnostics.FileVersionInfo]::GetVersionInfo('$(cygpath -w "$path")'); \$v.FileVersion" 2>/dev/null | tr -d '\r\n ')"
    if [ -z "$fv" ]; then
      warn "$file has no readable FileVersion resource"
      versioncheck="missing"; FAIL=1
    else
      case "$fv" in "$VERSION"*) versioncheck="ok:$fv" ;; *) warn "$file FileVersion=$fv expected $VERSION.x"; versioncheck="bad:$fv"; FAIL=1 ;; esac
    fi
  fi

  smoke="not-executed"
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$file" "$os" "$arch" "$kind" "$bytes" "$sha" "$archcheck" "$versioncheck" "$smoke" "pending" >> "$TSV"
  ok "$file  $bytes bytes  arch=$archcheck version=$versioncheck"
}

# --- expected matrix ----------------------------------------------------
emit "tianji-sizhu-$VERSION-windows-amd64-setup.exe"     windows amd64 setup
emit "tianji-sizhu-$VERSION-windows-arm64-setup.exe"     windows arm64 setup
emit "tianji-sizhu-$VERSION-windows-amd64-portable.zip"  windows amd64 portable
emit "tianji-sizhu-$VERSION-windows-arm64-portable.zip"  windows arm64 portable
# macOS ships a signed .app zip: hdiutil is unusable on CI runners (hangs in
# kernel state), and ditto preserves the ad-hoc signature and symlinks.
emit "tianji-sizhu-$VERSION-macos-amd64-app.zip"         macos   amd64 appzip
emit "tianji-sizhu-$VERSION-macos-arm64-app.zip"         macos   arm64 appzip

if [ "$ALLOW_PARTIAL" = "1" ] && [ -n "$MISSING" ]; then
  warn "partial build: missing$MISSING (allowed locally, forbidden in CI)"
  FAIL=0
fi

# --- manifest -----------------------------------------------------------
node - "$TSV" "$DIST/artifacts-manifest.json" "$VERSION" "$RELEASE_ROOT" <<'NODE'
const fs = require('fs')
const [tsvPath, outPath, version, root] = process.argv.slice(2)

const rows = fs.existsSync(tsvPath)
  ? fs.readFileSync(tsvPath, 'utf8').split('\n').filter(Boolean).map(line => {
      const [file, platform, arch, kind, bytes, sha256, archCheck, versionCheck, smoke, smokeState] = line.split('\t')
      return {
        id: `${platform}-${arch}-${kind}`,
        platform, arch, kind, file,
        bytes: Number(bytes), sha256,
        checks: { arch: archCheck, version: versionCheck, smoke },
        smoke_state: smokeState,
      }
    })
  : []

const missing = rows.length === 0
const failures = rows.filter(r => r.checks.arch.includes('MISMATCH') || r.checks.version.startsWith('bad') || r.checks.version === 'missing')

const manifest = {
  version,
  git_sha: (() => {
    try {
      return require('child_process').execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim()
    } catch { return '' }
  })(),
  generated_at: new Date().toISOString(),
  artifacts: rows,
  summary: {
    all_checks_pass: !missing && failures.length === 0,
    failures: failures.map(f => f.file),
  },
}
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n')
NODE

if [ "$FAIL" = "0" ]; then
  ok "manifest: $DIST/artifacts-manifest.json"
else
  warn "verification failed; see messages above"
fi
exit "$FAIL"
