const initState = {
  isBackup: false,
};
export function backupPage(
  state = initState,
  action: { type: string; payload: boolean }
) {
  switch (action.type) {
    case "HANDLE_BACKUP":
      return {
        ...state,
        isBackup: action.payload,
      };

    default:
      return state;
  }
}

export function handleBackupDialog(mode: boolean) {
  return { type: "HANDLE_BACKUP", payload: mode };
}
