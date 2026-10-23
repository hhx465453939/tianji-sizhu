#!/usr/bin/env bash
# Version single source of truth (ADR-002).
#
#   version.sh sync    VERSION -> frontend/package.json, wails.json, docs/SPEC.md (--docs)
#   version.sh check   verify every downstream copy matches VERSION (exit 1 on drift)
#   version.sh tag     print v<VERSION> for CI tag comparison
set -euo pipefail

source "$(dirname "$0")/lib.sh"

CMD="${1:-check}"
WITH_DOCS=0
for arg in "$@"; do
  [ "$arg" = "--docs" ] && WITH_DOCS=1
done

PKG_JSON="$RELEASE_ROOT/frontend/package.json"
WAILS_JSON="$RELEASE_ROOT/wails.json"
DOCS_SPEC="$RELEASE_ROOT/docs/SPEC.md"

# Fixed identity fields written into wails.json.info (ASCII company name is used
# for registry keys and install paths, so it must stay ASCII).
PRODUCT_NAME="天机四柱"
COMPANY_NAME="TianJi-SiZhu"
COPYRIGHT="Copyright (c) TianJi-SiZhu contributors"

sync_json() {
  local v="$1"
  node -e '
    const fs = require("fs");
    const [version, pkgPath, wailsPath, productName, companyName, copyright] = process.argv.slice(1);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.version = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    const w = JSON.parse(fs.readFileSync(wailsPath, "utf8"));
    w.info = Object.assign({}, w.info, {
      companyName: companyName,
      productName: productName,
      productVersion: version,
      copyright: copyright,
    });
    fs.writeFileSync(wailsPath, JSON.stringify(w, null, 2) + "\n");
  ' "$v" "$PKG_JSON" "$WAILS_JSON" "$PRODUCT_NAME" "$COMPANY_NAME" "$COPYRIGHT"
}

sync_docs() {
  local v="$1"
  [ -f "$DOCS_SPEC" ] || return 0
  node -e '
    const fs = require("fs");
    const [version, file] = process.argv.slice(1);
    let s = fs.readFileSync(file, "utf8");
    const before = s;
    s = s.replace(/^(\*\*版本\*\*:\s*)v?[0-9]+\.[0-9]+\.[0-9]+/m, `$1v${version}`);
    if (s !== before) fs.writeFileSync(file, s);
  ' "$v" "$DOCS_SPEC"
}

case "$CMD" in
  sync)
    V="$(read_version)"; assert_semver "$V"
    sync_json "$V"
    [ "$WITH_DOCS" = "1" ] && sync_docs "$V"
    ok "synced VERSION=$V -> frontend/package.json, wails.json$([ "$WITH_DOCS" = "1" ] && echo ', docs/SPEC.md')"
    ;;

  check)
    V="$(read_version)"; assert_semver "$V"
    FAIL=0

    PKG_V="$(read_json "$PKG_JSON" version || true)"
    if [ "$PKG_V" = "$V" ]; then
      ok "frontend/package.json version = $V"
    else
      warn "frontend/package.json version = '${PKG_V:-<missing>}' (expected $V)"; FAIL=1
    fi

    WAILS_V="$(read_json "$WAILS_JSON" info.productVersion || true)"
    if [ "$WAILS_V" = "$V" ]; then
      ok "wails.json info.productVersion = $V"
    else
      warn "wails.json info.productVersion = '${WAILS_V:-<missing>}' (expected $V)"; FAIL=1
    fi

    WAILS_NAME="$(read_json "$WAILS_JSON" info.productName || true)"
    [ "$WAILS_NAME" = "$PRODUCT_NAME" ] || { warn "wails.json info.productName = '${WAILS_NAME:-<missing>}' (expected $PRODUCT_NAME)"; FAIL=1; }

    # CI: the git tag must match VERSION exactly.
    if [ -n "${GITHUB_REF_NAME:-}" ] && [[ "${GITHUB_REF_NAME}" == v* ]]; then
      if [ "$GITHUB_REF_NAME" = "v$V" ]; then
        ok "git tag $GITHUB_REF_NAME matches VERSION"
      else
        warn "git tag $GITHUB_REF_NAME does not match v$V"; FAIL=1
      fi
    fi

    [ "$FAIL" = "0" ] && ok "version sources are consistent ($V)" || die "version drift detected" 1
    ;;

  tag)
    echo "v$(read_version)"
    ;;

  *)
    cat <<'USAGE'
usage: version.sh <sync|check|tag> [--docs]

  sync    write VERSION into frontend/package.json and wails.json
          (--docs also updates the version line in docs/SPEC.md)
  check   verify all downstream copies agree with VERSION
  tag     print v<VERSION> (for CI comparison against GITHUB_REF_NAME)
USAGE
    exit 2
    ;;
esac
