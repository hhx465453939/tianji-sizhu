#Requires -Version 5.1
<#
.SYNOPSIS
    TianJi-SiZhu Local Build Script (Windows)
.DESCRIPTION
    Builds the Wails application for the current platform.
    Optionally creates an NSIS installer.
.PARAMETER Installer
    If specified, creates an NSIS installer package.
.PARAMETER Clean
    If specified, cleans build artifacts before building.
.EXAMPLE
    .\scripts\build.ps1
    .\scripts\build.ps1 -Installer
    .\scripts\build.ps1 -Clean -Installer
#>

param(
    [switch]$Installer,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

# ── Constants ──────────────────────────────────
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AppName = "tianji-sizhu"
$BuildDir = Join-Path $ProjectRoot "build\bin"

# ── Helper Functions ───────────────────────────
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

# ── Preflight Checks ──────────────────────────
Write-Step "Preflight checks"

# Check Go
if (-not (Get-Command go -ErrorAction SilentlyContinue)) { Write-Fail "Go is not installed or not in PATH" }
$goVersion = & go version 2>$null
Write-Ok "Go: $goVersion"

# Check Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Fail "Node.js is not installed or not in PATH" }
$nodeVersion = & node --version 2>$null
Write-Ok "Node.js: $nodeVersion"

# Check pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { Write-Fail "pnpm is not installed. Run: npm install -g pnpm" }
$pnpmVersion = & pnpm --version 2>$null
Write-Ok "pnpm: v$pnpmVersion"

# Check Wails
if (-not (Get-Command wails -ErrorAction SilentlyContinue)) { Write-Fail "Wails CLI is not installed. Run: go install github.com/wailsapp/wails/v2/cmd/wails@latest" }
$wailsVersion = & wails version 2>$null
Write-Ok "Wails: $wailsVersion"

# Check NSIS (if installer requested)
if ($Installer) {
    $nsisFound = $false
    if (Get-Command makensis -ErrorAction SilentlyContinue) {
        $nsisFound = $true
    } else {
        $nsisPaths = @(
            "C:\Program Files (x86)\NSIS\makensis.exe",
            "C:\Program Files\NSIS\makensis.exe"
        )
        foreach ($p in $nsisPaths) {
            if (Test-Path $p) { $nsisFound = $true; break }
        }
    }
    if (-not $nsisFound) { Write-Fail "NSIS is not installed. Install via: choco install nsis" }
    Write-Ok "NSIS found"
}

# ── Clean (optional) ──────────────────────────
if ($Clean) {
    Write-Step "Cleaning build artifacts"
    if (Test-Path $BuildDir) {
        Remove-Item -Recurse -Force $BuildDir
        Write-Ok "Removed $BuildDir"
    }
}

# ── Install Frontend Dependencies ─────────────
Write-Step "Installing frontend dependencies"

$frontendDir = Join-Path $ProjectRoot "frontend"
Push-Location $frontendDir
try {
    & pnpm install --prefer-offline 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] pnpm install failed, falling back to npm..." -ForegroundColor Yellow
        & npm install
        if ($LASTEXITCODE -ne 0) { Write-Fail "npm install also failed" }
    }
} finally {
    Pop-Location
}
Write-Ok "Frontend dependencies installed"

# ── Build ──────────────────────────────────────
Write-Step "Building $AppName for Windows amd64"

$wailsArgs = @("build", "-platform", "windows/amd64", "-o", "$AppName.exe")
if ($Installer) {
    $wailsArgs += "-nsis"
}

Push-Location $ProjectRoot
try {
    & wails $wailsArgs
    if ($LASTEXITCODE -ne 0) { Write-Fail "wails build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}
Write-Ok "Build completed"

# ── Output ─────────────────────────────────────
Write-Step "Build output"

$exePath = Join-Path $BuildDir "$AppName.exe"
$installerPath = Join-Path $BuildDir "$AppName-amd64-installer.exe"

if (Test-Path $exePath) {
    $sizeMB = [math]::Round((Get-Item $exePath).Length / 1MB, 2)
    $msg = "Binary: $exePath ($sizeMB MB)"
    Write-Ok $msg
}

if ($Installer -and (Test-Path $installerPath)) {
    $sizeMB = [math]::Round((Get-Item $installerPath).Length / 1MB, 2)
    $msg = "Installer: $installerPath ($sizeMB MB)"
    Write-Ok $msg
}

Write-Host ""
Write-Host "Build complete!" -ForegroundColor Green
