!macro customInit
!macroend

!macro customInstall
  ; Kill running Koodo Reader process before installation to prevent file locking
  nsExec::ExecToLog 'taskkill /f /im "Koodo Reader.exe"'
  ; Wait for the OS to release file handles after process termination
  Sleep 3000
!macroend

!macro customUnInstall
  MessageBox MB_YESNO "Do you want to delete all your data including books, notes, highlights, bookmarks, configurations?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\koodo-reader"
  SkipRemoval:
!macroend