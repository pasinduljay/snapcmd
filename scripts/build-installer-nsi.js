import fs from 'fs';

let content = fs.readFileSync('src-tauri/reference-installer.nsi', 'utf8');

// 1. Welcome and finish page text customization
const welcomeReplacement = `; 1. Welcome Page
!define MUI_WELCOMEPAGE_TITLE "Welcome to Snapcmd Setup"
!define MUI_WELCOMEPAGE_TEXT "Setup will guide you through the installation of Snapcmd, your fast and modern command snippet manager.\\r\\n\\r\\nClick Next to continue."
!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
!insertmacro MUI_PAGE_WELCOME`;

content = content.replace(
  `; 1. Welcome Page\r\n!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive\r\n!insertmacro MUI_PAGE_WELCOME`,
  welcomeReplacement
);
// In case of LF instead of CRLF:
content = content.replace(
  `; 1. Welcome Page\n!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive\n!insertmacro MUI_PAGE_WELCOME`,
  welcomeReplacement
);

// 2. Finish page
const finishReplacement = `; 8. Finish page
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_SHOWREADME
!define MUI_FINISHPAGE_SHOWREADME_TEXT "$(createDesktop)"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateOrUpdateDesktopShortcut
!define MUI_FINISHPAGE_TITLE "Snapcmd Setup Completed"
!define MUI_FINISHPAGE_TEXT "Snapcmd has been successfully installed on your computer.\\r\\n\\r\\nClick Finish to exit Setup."
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION RunMainBinary
!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
!insertmacro MUI_PAGE_FINISH`;

content = content.replace(/; 8\. Finish page[\s\S]*?!insertmacro MUI_PAGE_FINISH/, finishReplacement);

// 3. Early app check in .onInit
content = content.replace(
  /Function \.onInit\r?\n/,
  `Function .onInit\r\n  !insertmacro CheckIfAppIsRunning "\${MAINBINARYNAME}.exe" "\${PRODUCTNAME}"\r\n`
);

// 4. Update PageReinstall strings
const reinstallSearch = /; Reinstalling the same version[\s\S]*?!insertmacro MUI_HEADER_TEXT "\$\(alreadyInstalled\)" "\$\(choowHowToInstall\)"/;
const reinstallReplace = `; Reinstalling the same version
  \${If} $R0 = 0
    StrCpy $R1 "\${PRODUCTNAME} \${VERSION} is already installed on your system.\\r\\n\\r\\nSelect a maintenance option to perform:"
    StrCpy $R2 "Repair / Reinstall \${PRODUCTNAME} \${VERSION}"
    StrCpy $R3 "Uninstall \${PRODUCTNAME}"
    !insertmacro MUI_HEADER_TEXT "Already Installed" "Choose Maintenance Option"
  ; Upgrading
  \${ElseIf} $R0 = 1
    StrCpy $R1 "An earlier version of \${PRODUCTNAME} ($R0) was detected on your system.\\r\\n\\r\\nSelect how you want to proceed with the installation:"
    StrCpy $R2 "Upgrade to \${PRODUCTNAME} \${VERSION} (Recommended)"
    StrCpy $R3 "Uninstall earlier version before clean install"
    !insertmacro MUI_HEADER_TEXT "Update Detected" "Choose How to Update"`;

content = content.replace(reinstallSearch, reinstallReplace);

// 5. Update PageLeaveReinstall logic for clean upgrades
const pageLeaveSearch = /Function PageLeaveReinstall[\s\S]*?FunctionEnd/;
const pageLeaveReplace = `Function PageLeaveReinstall
  \${NSD_GetState} $R2 $R1

  ; If migrating from Wix, always uninstall
  \${If} $WixMode = 1
    Goto reinst_uninstall
  \${EndIf}

  ; In update mode, always proceeds without uninstalling
  \${If} $UpdateMode = 1
    Goto reinst_done
  \${EndIf}

  ; $R0 holds whether same(0)/upgrading(1)/downgrading(-1) version
  ; $R1 holds the radio buttons state:
  ;   1 => first choice was selected
  ;   0 => second choice was selected
  \${If} $R0 = 0 ; Same version
    \${If} $R1 = 1              ; User chose to repair/reinstall
      Goto reinst_done
    \${Else}                    ; User chose to uninstall
      Goto reinst_uninstall_and_quit
    \${EndIf}
  \${ElseIf} $R0 = 1 ; Upgrading
    \${If} $R1 = 1              ; User chose to upgrade
      ; Silent clean upgrade: remove old version quietly then install new version
      Goto reinst_uninstall_silent
    \${Else}
      ; User chose interactive uninstall of older version first
      Goto reinst_uninstall
    \${EndIf}
  \${ElseIf} $R0 = -1 ; Downgrading
    \${If} $R1 = 1              ; User chose to uninstall
      Goto reinst_uninstall
    \${Else}
      Goto reinst_done         ; User chose NOT to uninstall
    \${EndIf}
  \${EndIf}

  reinst_uninstall_silent:
    !insertmacro CheckIfAppIsRunning "\${MAINBINARYNAME}.exe" "\${PRODUCTNAME}"
    HideWindow
    ClearErrors
    ReadRegStr $4 SHCTX "\${MANUPRODUCTKEY}" ""
    ReadRegStr $R1 SHCTX "\${UNINSTKEY}" "UninstallString"
    \${IfThen} $UpdateMode = 1 \${|} StrCpy $R1 "$R1 /UPDATE" \${|}
    \${IfThen} $PassiveMode = 1 \${|} StrCpy $R1 "$R1 /P" \${|}
    StrCpy $R1 "$R1 /S _?=$4"
    ExecWait '$R1' $0
    BringToFront
    Goto reinst_done

  reinst_uninstall_and_quit:
    !insertmacro CheckIfAppIsRunning "\${MAINBINARYNAME}.exe" "\${PRODUCTNAME}"
    HideWindow
    ClearErrors
    ReadRegStr $4 SHCTX "\${MANUPRODUCTKEY}" ""
    ReadRegStr $R1 SHCTX "\${UNINSTKEY}" "UninstallString"
    StrCpy $R1 "$R1 _?=$4"
    ExecWait '$R1' $0
    Quit

  reinst_uninstall:
    !insertmacro CheckIfAppIsRunning "\${MAINBINARYNAME}.exe" "\${PRODUCTNAME}"
    HideWindow
    ClearErrors

    \${If} $WixMode = 1
      ReadRegStr $R1 HKLM "$R6" "UninstallString"
      ExecWait '$R1' $0
    \${Else}
      ReadRegStr $4 SHCTX "\${MANUPRODUCTKEY}" ""
      ReadRegStr $R1 SHCTX "\${UNINSTKEY}" "UninstallString"
      \${IfThen} $UpdateMode = 1 \${|} StrCpy $R1 "$R1 /UPDATE" \${|}
      \${IfThen} $PassiveMode = 1 \${|} StrCpy $R1 "$R1 /P" \${|}
      StrCpy $R1 "$R1 _?=$4"
      ExecWait '$R1' $0
    \${EndIf}

    BringToFront

    \${IfThen} \${Errors} \${|} StrCpy $0 2 \${|}

    \${If} $0 <> 0
    \${OrIf} \${FileExists} "$INSTDIR\\\${MAINBINARYNAME}.exe"
      \${If} $WixMode = 1
      \${AndIf} $0 = 1602
        Abort
      \${EndIf}
      \${If} $0 = 1
        Abort
      \${EndIf}
      MessageBox MB_ICONEXCLAMATION "$(unableToUninstall)"
      Abort
    \${EndIf}
  reinst_done:
FunctionEnd`;

content = content.replace(pageLeaveSearch, pageLeaveReplace);

fs.writeFileSync('src-tauri/installer.nsi', content);
console.log('Successfully generated src-tauri/installer.nsi, length:', content.length);
