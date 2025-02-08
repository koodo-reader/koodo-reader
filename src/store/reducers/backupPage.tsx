const initState = {
  isBackup: false,
  isOpenTokenDialog: false,
  dataSourceList: [],
  loginOptionList: [],
  defaultSyncOption: "",
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
    case "HANDLE_LOGIN_OPTION":
      return {
        ...state,
        loginOptionList: action.payload,
      };
    case "SET_DATA_SOURCE":
      return {
        ...state,
        dataSourceList: action.payload,
      };
    case "HANDLE_DEFAULT_SYNC_OPTION":
      return {
        ...state,
        defaultSyncOption: action.payload,
      };
    default:
      return state;
  }
}
