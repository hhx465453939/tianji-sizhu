@echo off
:: TianJi-SiZhu Build Launcher
:: Bypasses PowerShell execution policy to run build scripts.
:: Usage: build.cmd [--installer] [--clean]

setlocal

set "ARGS="
if /i "%~1"=="--installer" set "ARGS=-Installer"
if /i "%~2"=="--installer" set "ARGS=%ARGS% -Installer"
if /i "%~1"=="--clean" set "ARGS=%ARGS% -Clean"
if /i "%~2"=="--clean" set "ARGS=%ARGS% -Clean"

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\build.ps1" %ARGS%

endlocal
