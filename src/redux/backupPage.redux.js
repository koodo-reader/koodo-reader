const initState = {
  isBackup: false,
};
export function backupPage(state = initState, action) {
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

export function handleBackup(mode) {
  return { type: "HANDLE_BACKUP", payload: mode };
}
