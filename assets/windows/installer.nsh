!macro customUnInstall
  MessageBox MB_YESNO "Do you want to delete all your data including books, notes, highlights, bookmarks, configurations?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\koodo-reader"
  SkipRemoval:
!macroend