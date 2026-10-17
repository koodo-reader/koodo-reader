!macro customInit
!macroend

!macro customInstall
  ; Kill running Koodo Reader process before installation to prevent file locking
  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /f /im "Koodo Reader.exe"'
  ; Wait for the OS to release file handles after process termination
  Sleep 3000
!macroend

!macro customUnInstall
  ; The one-click uninstaller runs this section in silent mode (un.onInit calls
  ; SetSilent silent), so a MessageBox with /SD would be auto-dismissed and user
  ; data would never be deleted. Only ask when the uninstaller was launched
  ; manually (no /S flag). Silent runs (auto-update or overwrite install always
  ; pass /S /KEEP_APP_DATA) must never touch user data.
  ${GetParameters} $R0
  ${GetOptions} $R0 "/S" $R1
  ${If} ${Errors}
    SetSilent normal
    MessageBox MB_YESNO "Delete all data as well? Books, notes, highlights, bookmarks and settings will be permanently removed.$\r$\n$\r$\n是否同时删除全部数据？书籍、笔记、高亮、书签和设置将被永久删除，且无法恢复。" /SD IDNO IDNO SkipRemoval
      SetShellVarContext current
      RMDir /r "$APPDATA\koodo-reader"
      RMDir /r "$LOCALAPPDATA\koodo-reader-updater"
    SkipRemoval:
    SetSilent silent
  ${EndIf}
!macroend