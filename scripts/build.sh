#!/usr/bin/env bash
# ============================================================
# TianJi-SiZhu Local Build Script (macOS / Linux)
# Usage: ./scripts/build.sh [--installer]
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_NAME="tianji-sizhu"
BUILD_DIR="$PROJECT_ROOT/build/bin"

# ── Helpers ────────────────────────────────────
step()  { echo -e "\n━━━ $1 ━━━"; }
ok()    { echo -e "  ✓ $1"; }
fail()  { echo -e "  ✗ $1"; exit 1; }

INSTALLER=false
[[ "${1:-}" == "--installer" ]] && INSTALLER=true

cd "$PROJECT_ROOT"

# ── Preflight Checks ──────────────────────────
step "Preflight checks"

command -v go    >/dev/null 2>&1 || fail "Go is not installed"
ok "Go: $(go version)"

command -v node  >/dev/null 2>&1 || fail "Node.js is not installed"
ok "Node.js: $(node --version)"

command -v pnpm  >/dev/null 2>&1 || fail "pnpm is not installed. Run: npm install -g pnpm"
ok "pnpm: v$(pnpm --version)"

command -v wails >/dev/null 2>&1 || fail "Wails CLI is not installed. Run: go install github.com/wailsapp/wails/v2/cmd/wails@latest"
ok "Wails: $(wails version 2>/dev/null | head -1)"

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
    Darwin) PLATFORM="darwin" ;;
    Linux)  PLATFORM="linux"  ;;
    *)      fail "Unsupported OS: $OS" ;;
esac
case "$ARCH" in
    x86_64|amd64) ARCH="amd64" ;;
    arm64|aarch64) ARCH="arm64" ;;
esac

ok "Platform: $PLATFORM/$ARCH"

# ── Install Frontend Dependencies ─────────────
step "Installing frontend dependencies"
(
    cd frontend
    if ! pnpm install --prefer-offline 2>/dev/null; then
        echo "  [WARN] pnpm install failed, falling back to npm..."
        npm install || fail "npm install also failed"
    fi
)
ok "Frontend dependencies installed"

# ── Build ──────────────────────────────────────
step "Building $APP_NAME for $PLATFORM/$ARCH"

WAILS_ARGS=(build -platform "$PLATFORM/$ARCH" -o "$APP_NAME")
wails "${WAILS_ARGS[@]}"
ok "Build completed"

# ── Post-build Packaging ──────────────────────
step "Packaging"

if [[ "$PLATFORM" == "darwin" ]]; then
    # Create DMG
    APP_PATH="$BUILD_DIR/$APP_NAME.app"
    DMG_PATH="$BUILD_DIR/$APP_NAME-$PLATFORM-$ARCH.dmg"

    if [[ -d "$APP_PATH" ]]; then
        STAGING=$(mktemp -d)
        cp -r "$APP_PATH" "$STAGING/"
        ln -s /Applications "$STAGING/Applications"

        hdiutil create \
            -volname "天机四柱" \
            -srcfolder "$STAGING" \
            -ov -format UDZO \
            "$DMG_PATH"

        rm -rf "$STAGING"
        ok "DMG: $DMG_PATH"
    fi

elif [[ "$PLATFORM" == "linux" ]]; then
    # Create tar.gz
    BIN_PATH="$BUILD_DIR/$APP_NAME"
    TAR_PATH="$BUILD_DIR/$APP_NAME-$PLATFORM-$ARCH.tar.gz"

    if [[ -f "$BIN_PATH" ]]; then
        tar czf "$TAR_PATH" -C "$BUILD_DIR" "$APP_NAME"
        ok "tar.gz: $TAR_PATH"
    fi
fi

# ── Output Summary ────────────────────────────
step "Build output"
echo ""
ls -lh "$BUILD_DIR"/ 2>/dev/null || true
echo ""
echo "🎉 Build complete!"
