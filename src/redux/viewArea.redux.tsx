const initState = {
  selection: null,
  highlighters: [],
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
    default:
      return state;
  }
}

export function handleOpenMenu(isOpenMenu: boolean) {
  return { type: "HANDLE_OPEN_MENU", payload: isOpenMenu };
}
export function handleOpenHighlight(isOpenHighlight: boolean) {
  return { type: "HANDLE_OPEN_HIGHLIGHT", payload: isOpenHighlight };
}

export function handleSelection(selection: string) {
  return { type: "HANDLE_SELECTION", payload: selection };
}
