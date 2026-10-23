Unicode true

####
## Customised NSIS script (committed on purpose: see CHG-004 ADR-005/ADR-011).
##
## Wails only writes build/ templates when the file is MISSING, so keeping this
## file in the repo makes the installer configuration auditable and reproducible
## instead of regenerating defaults on every build.
##
## Values that must stay pinned for automation:
##   UNINST_KEY_NAME    ASCII, used by the install/uninstall smoke test
##   InstallDir         per-machine, fixed path (no ${PRODUCTNAME} interpolation)
##   PRODUCT_EXECUTABLE must match wails.json outputfilename
##
## wails_tools.nsh is NOT committed - it is regenerated per build and carries the
## resolved version string, which is exactly how version drift is avoided.
##
## Manual invocation (for debugging without Wails):
##   makensis -DARG_WAILS_AMD64_BINARY=..\..\bin\app.exe project.nsi
##   makensis -DARG_WAILS_ARM64_BINARY=..\..\bin\app.exe project.nsi
####

!define PRODUCT_EXECUTABLE  "tianji-sizhu.exe"
!define UNINST_KEY_NAME     "TianJi-SiZhu"
!define INSTALL_DIR_NAME    "TianJi-SiZhu"

## Include the wails tools (populates INFO_* and the wails.* macros)
!include "wails_tools.nsh"

# The version information for these two must consist of 4 parts
VIProductVersion "${INFO_PRODUCTVERSION}.0"
VIFileVersion    "${INFO_PRODUCTVERSION}.0"

VIAddVersionKey "CompanyName"     "${INFO_COMPANYNAME}"
VIAddVersionKey "FileDescription" "${INFO_PRODUCTNAME} Installer"
VIAddVersionKey "ProductVersion"  "${INFO_PRODUCTVERSION}"
VIAddVersionKey "FileVersion"     "${INFO_PRODUCTVERSION}"
VIAddVersionKey "LegalCopyright"  "${INFO_COPYRIGHT}"
VIAddVersionKey "ProductName"     "${INFO_PRODUCTNAME}"

# Enable HiDPI support. https://nsis.sourceforge.io/Reference/ManifestDPIAware
ManifestDPIAware true

!include "MUI.nsh"

!define MUI_ICON "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_INSTFILES

# Simplified Chinese first (default), English as fallback.
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

## Signing is intentionally NOT configured: this project ships unsigned builds
## and a half-open signtool hook would only produce confusing failures.
#!uninstfinalize 'signtool --file "%1"'
#!finalize 'signtool --file "%1"'

Name "${INFO_PRODUCTNAME}"
OutFile "..\..\bin\${INFO_PROJECTNAME}-${ARCH}-installer.exe"
InstallDir "$PROGRAMFILES64\${INSTALL_DIR_NAME}"
ShowInstDetails show

Function .onInit
   !insertmacro wails.checkArchitecture
FunctionEnd

Section
    !insertmacro wails.setShellContext

    !insertmacro wails.webview2runtime

    SetOutPath $INSTDIR

    !insertmacro wails.files

    CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"
    CreateShortCut "$DESKTOP\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"

    !insertmacro wails.associateFiles
    !insertmacro wails.associateCustomProtocols

    !insertmacro wails.writeUninstaller
SectionEnd

Section "uninstall"
    !insertmacro wails.setShellContext

    # WebView2 profile cache (Roaming), not user chart data.
    RMDir /r "$AppData\${PRODUCT_EXECUTABLE}"

    RMDir /r $INSTDIR

    Delete "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk"
    Delete "$DESKTOP\${INFO_PRODUCTNAME}.lnk"

    !insertmacro wails.unassociateFiles
    !insertmacro wails.unassociateCustomProtocols

    # NOTE: user data lives in %LOCALAPPDATA%\TianJi-SiZhu\data (CHG-004 ADR-003)
    # and is deliberately NOT removed on uninstall.

    !insertmacro wails.deleteUninstaller
SectionEnd
