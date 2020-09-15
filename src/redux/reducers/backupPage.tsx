const initState = {
  isBackup: false,
  isOpenTokenDialog: false,
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
    case "HANDLE_TOKEN_DIALOG":
      return {
        ...state,
        isOpenTokenDialog: action.payload,
      };
    default:
      return state;
  }
}
