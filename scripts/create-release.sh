#!/usr/bin/env bash
# ============================================================
# TianJi-SiZhu Release Script (macOS / Linux)
# Usage: ./scripts/create-release.sh [version]
# Default version: 1.0.0
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION="${1:-1.0.0}"
TAG="v$VERSION"
DRY_RUN="${DRY_RUN:-false}"

# ── Helpers ────────────────────────────────────
step()  { echo -e "\n━━━ $1 ━━━"; }
ok()    { echo -e "  ✓ $1"; }
fail()  { echo -e "  ✗ $1"; exit 1; }

cd "$PROJECT_ROOT"

# ── Preflight ──────────────────────────────────
step "Preflight checks"

command -v gh >/dev/null 2>&1 || fail "GitHub CLI (gh) is not installed. https://cli.github.com/"
ok "GitHub CLI: $(gh --version | head -1)"

# Check clean working tree
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    echo ""
    echo "⚠️  Working tree has uncommitted changes:"
    git status --short
    echo ""
    read -rp "Continue anyway? (y/N) " confirm
    [[ "$confirm" == "y" || "$confirm" == "Y" ]] || fail "Aborted."
fi

# Check tag doesn't exist
if git tag -l "$TAG" | grep -q "$TAG"; then
    fail "Tag '$TAG' already exists."
fi

# Check branch
BRANCH=$(git branch --show-current 2>/dev/null)
if [[ "$BRANCH" != "main" ]]; then
    echo "⚠️  Current branch is '$BRANCH', not 'main'"
    read -rp "Continue anyway? (y/N) " confirm
    [[ "$confirm" == "y" || "$confirm" == "Y" ]] || fail "Aborted."
fi
ok "Git checks passed (branch: $BRANCH)"

# ── Update Versions ───────────────────────────
step "Updating version to $VERSION"

# frontend/package.json
if [[ -f "frontend/package.json" ]]; then
    # Use node for reliable JSON editing
    node -e "
        const fs = require('fs');
        const p = JSON.parse(fs.readFileSync('frontend/package.json','utf8'));
        const old = p.version;
        p.version = '$VERSION';
        fs.writeFileSync('frontend/package.json', JSON.stringify(p, null, 2) + '\n');
        console.log('  ✓ frontend/package.json: ' + old + ' → $VERSION');
    "
fi

# docs/SPEC.md
if [[ -f "docs/SPEC.md" ]]; then
    sed -i.bak "s/v[0-9]*\.[0-9]*\.[0-9]* *(.*)/v$VERSION (Release)/g" "docs/SPEC.md"
    rm -f "docs/SPEC.md.bak"
    ok "docs/SPEC.md version updated"
fi

# ── Commit & Tag ──────────────────────────────
step "Committing version bump"

if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would commit: chore: bump version to v$VERSION"
    echo "  [DRY RUN] Would create tag: $TAG"
    echo "  [DRY RUN] Would push to origin"
else
    git add frontend/package.json docs/SPEC.md
    git commit -m "chore: bump version to v$VERSION"
    ok "Version bump committed"

    step "Creating tag $TAG"
    git tag -a "$TAG" -m "Release $TAG - 天机四柱"
    ok "Tag '$TAG' created"

    step "Pushing to origin"
    git push origin "$BRANCH"
    git push origin "$TAG"
    ok "Pushed tag '$TAG' to origin"
fi

# ── Summary ───────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  🎉 Release $TAG published!"
echo "════════════════════════════════════════════"
echo ""
echo "  GitHub Actions will now:"
echo "    1. Build for Windows (NSIS installer)"
echo "    2. Build for macOS (Universal DMG)"
echo "    3. Build for Linux (AppImage + tar.gz)"
echo "    4. Create GitHub Release with all assets"
echo ""
echo "  Track progress:"
echo "    https://github.com/hhx465453939/tianji-sizhu/actions"
echo ""
