const initState = {
  selection: null,
  highlighters: [],
  isOpenMenu: false,
  menuMode: "menu",
  isChangeDirection: false,
};
export function viewArea(
  state = initState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "HANDLE_OPEN_MENU":
      return {
        ...state,
        isOpenMenu: action.payload,
      };
    case "HANDLE_OPEN_HIGHLIGHT":
      return {
        ...state,
        isOpenHighlight: action.payload,
      };
    case "HANDLE_SELECTION":
      return {
        ...state,
        selection: action.payload,
      };
    case "HANDLE_DIALOG_LOCATION":
      return {
        ...state,
        dialogLocation: action.payload,
      };
    case "HANDLE_MENU_MODE":
      return {
        ...state,
        menuMode: action.payload,
      };
    case "HANDLE_CHANGE_DIRECTION":
      return {
        ...state,
        isChangeDirection: action.payload,
      };
    default:
      return state;
  }
}
