<#
.SYNOPSIS
  Windows install/uninstall lifecycle smoke test (CHG-004 ADR-008 L3).

.DESCRIPTION
  Installs into a throwaway directory, asserts the install actually works
  (binary present, registry DisplayVersion correct, app survives 5s, portable
  data dir created), then uninstalls and proves zero residue.

  Per-machine installers need elevation. When not elevated the test degrades to
  SKIP (exit 0) and says why, so a local run never reports a false pass.

.PARAMETER Installer
  Path to the NSIS setup.exe.

.PARAMETER ExpectVersion
  Version string that must appear in the registry DisplayVersion.

.PARAMETER ExpectArch
  amd64 or arm64 (recorded in the log; the NSIS stub is always 32-bit).
#>
param(
  [Parameter(Mandatory = $true)][string]$Installer,
  [Parameter(Mandatory = $true)][string]$ExpectVersion,
  [string]$ExpectArch = "amd64"
)

$ErrorActionPreference = "Stop"

function Log($m) { Write-Host "[smoke] $m" }
function Fail($m) { Write-Host "[smoke] FAIL: $m" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $Installer)) { Fail "installer not found: $Installer" }

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Log "SKIP: not elevated; per-machine NSIS install requires admin (record as not-executed)"
  exit 0
}

$regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TianJi-SiZhu"
$tmp = Join-Path $env:TEMP ("tjs-smoke-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Path $tmp | Out-Null
Log "install dir: $tmp (arch=$ExpectArch)"

if (Test-Path $regPath) { Fail "registry key already exists before install; clean it first: $regPath" }

try {
  # --- install ---------------------------------------------------------
  # /D must be last and unquoted (NSIS requirement).
  $p = Start-Process -FilePath $Installer -ArgumentList "/S", "/D=$tmp" -Wait -PassThru
  Log "installer exit=$($p.ExitCode)"
  if ($p.ExitCode -ne 0) { Fail "installer returned $($p.ExitCode)" }

  $exe = Join-Path $tmp "tianji-sizhu.exe"
  if (-not (Test-Path $exe)) { Fail "installed binary missing: $exe" }

  if (-not (Test-Path $regPath)) { Fail "uninstall registry key missing: $regPath" }
  $displayVersion = (Get-ItemProperty $regPath).DisplayVersion
  if ($displayVersion -ne $ExpectVersion) {
    Fail "DisplayVersion='$displayVersion' expected '$ExpectVersion'"
  }
  Log "registry DisplayVersion=$displayVersion OK"

  # --- launch ----------------------------------------------------------
  $proc = Start-Process -FilePath $exe -PassThru
  Start-Sleep -Seconds 5
  if ($proc.HasExited) { Fail "app exited within 5s (exit=$($proc.ExitCode))" }
  Log "app alive after 5s (pid=$($proc.Id))"

  # Portable semantics: install dir is writable -> data/ lands next to the exe.
  $dataDir = Join-Path $tmp "data"
  if (-not (Test-Path $dataDir)) { Fail "data directory not created: $dataDir" }
  Log "data dir created next to binary (portable branch) OK"

  Stop-Process -Id $proc.Id -Force
  Start-Sleep -Seconds 1

  # --- uninstall -------------------------------------------------------
  $uninst = Join-Path $tmp "uninstall.exe"
  if (-not (Test-Path $uninst)) { Fail "uninstaller missing: $uninst" }
  $u = Start-Process -FilePath $uninst -ArgumentList "/S" -Wait -PassThru
  Log "uninstaller exit=$($u.ExitCode)"

  # --- residue polling (up to 30s; NSIS self-delete is asynchronous) ----
  $clean = $false
  for ($i = 0; $i -lt 30; $i++) {
    $exeGone = -not (Test-Path $exe)
    $regGone = -not (Test-Path $regPath)
    $procGone = -not (Get-Process tianji-sizhu -ErrorAction SilentlyContinue)
    if ($exeGone -and $regGone -and $procGone) { $clean = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $clean) {
    $exeGone = -not (Test-Path $exe)
    $regGone = -not (Test-Path $regPath)
    $procGone = -not (Get-Process tianji-sizhu -ErrorAction SilentlyContinue)
    Fail "residue after uninstall: exeGone=$exeGone regGone=$regGone procGone=$procGone"
  }
  Log "uninstall left no binary/registry/process residue"

  $userData = Join-Path $env:LOCALAPPDATA "TianJi-SiZhu\data"
  if (Test-Path $userData) {
    Log "NOTE: user data kept at $userData (intentional; uninstall never deletes charts)"
  }

  Log "PASS"
  exit 0
}
finally {
  if (Test-Path $tmp) {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  }
}
