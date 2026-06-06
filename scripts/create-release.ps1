#Requires -Version 5.1
<#
.SYNOPSIS
    TianJi-SiZhu Release Script
.DESCRIPTION
    Bumps version to 1.0.0, creates a git tag, and pushes to trigger
    the GitHub Actions release pipeline. Requires 'gh' CLI.
.PARAMETER Version
    Version string for the release (default: 1.0.0).
.PARAMETER DryRun
    If specified, shows what would be done without executing.
.EXAMPLE
    .\scripts\create-release.ps1
    .\scripts\create-release.ps1 -Version 1.1.0
    .\scripts\create-release.ps1 -DryRun
#>

param(
    [string]$Version = "1.0.0",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Tag = "v$Version"

# ── Helpers ────────────────────────────────────
function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "=== $Message ===" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
    exit 1
}

# ── Preflight ──────────────────────────────────
Write-Step "Preflight checks"

# Check gh CLI
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Fail "GitHub CLI (gh) is not installed. Install: https://cli.github.com/" }
$ghVersion = & gh --version 2>$null
Write-Ok "GitHub CLI: $($ghVersion[0])"

# Check git status - ensure clean working tree
Push-Location $ProjectRoot
try {
    $status = & git status --porcelain 2>$null
    if ($status) {
        Write-Host ""
        Write-Host "[WARN] Working tree has uncommitted changes:" -ForegroundColor Yellow
        & git status --short
        Write-Host ""

        $confirm = Read-Host "Continue anyway? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Fail "Aborted. Please commit or stash changes first."
        }
    }

    # Check if tag already exists
    $existingTag = & git tag -l $Tag 2>$null
    if ($existingTag) {
        Write-Fail "Tag '$Tag' already exists. Use a different version."
    }

    # Check we're on main branch
    $branch = & git branch --show-current 2>$null
    if ($branch -ne "main") {
        Write-Host "[WARN] Current branch is '$branch', not 'main'" -ForegroundColor Yellow
        $confirm = Read-Host "Continue anyway? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Fail "Aborted. Switch to main branch first."
        }
    }

    Write-Ok "Git checks passed (branch: $branch)"

    # ── Update Version in Files ────────────────────
    Write-Step "Updating version to $Version"

    # Update frontend/package.json
    $pkgJsonPath = Join-Path $ProjectRoot "frontend\package.json"
    if (Test-Path $pkgJsonPath) {
        $pkgJson = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
        $oldVersion = $pkgJson.version
        $pkgJson.version = $Version
        $pkgJson | ConvertTo-Json -Depth 10 | Set-Content $pkgJsonPath -Encoding UTF8
        Write-Ok "frontend/package.json: $oldVersion -> $Version"
    }

    # Update docs/SPEC.md version line
    $specPath = Join-Path $ProjectRoot "docs\SPEC.md"
    if (Test-Path $specPath) {
        $content = Get-Content $specPath -Raw
        $content = $content -replace 'v\d+\.\d+\.\d+\s+\(.*?\)', "v$Version (Release)"
        Set-Content $specPath -Value $content -Encoding UTF8
        Write-Ok "docs/SPEC.md version updated"
    }

    # ── Commit Version Bump ────────────────────────
    Write-Step "Committing version bump"

    if (-not $DryRun) {
        & git add "frontend/package.json" "docs/SPEC.md" 2>$null
        & git commit -m "chore: bump version to v$Version"
        Write-Ok "Version bump committed"
    } else {
        Write-Host "  [DRY RUN] Would commit: chore: bump version to v$Version" -ForegroundColor Yellow
    }

    # ── Create & Push Tag ──────────────────────────
    Write-Step "Creating tag $Tag"

    if (-not $DryRun) {
        & git tag -a $Tag -m "Release $Tag"
        Write-Ok "Tag '$Tag' created"

        Write-Step "Pushing to origin"
        & git push origin $branch
        & git push origin $Tag
        Write-Ok "Pushed tag '$Tag' to origin"
    } else {
        Write-Host "  [DRY RUN] Would create tag: $Tag" -ForegroundColor Yellow
        Write-Host "  [DRY RUN] Would push branch and tag to origin" -ForegroundColor Yellow
    }

    # ── Summary ────────────────────────────────────
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Release $Tag published!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  GitHub Actions will now:" -ForegroundColor White
    Write-Host "    1. Build for Windows (NSIS installer)" -ForegroundColor Gray
    Write-Host "    2. Build for macOS (Universal DMG)" -ForegroundColor Gray
    Write-Host "    3. Build for Linux (AppImage + tar.gz)" -ForegroundColor Gray
    Write-Host "    4. Create GitHub Release with all assets" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Track progress:" -ForegroundColor White
    Write-Host "    https://github.com/hhx465453939/tianji-sizhu/actions" -ForegroundColor Cyan
    Write-Host ""

} finally {
    Pop-Location
}
