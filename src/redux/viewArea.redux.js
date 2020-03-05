const initState = {
  selection: null,
  highlighters: []
  // cover:''
};
export function viewArea(state = initState, action) {
  switch (action.type) {
    case "HANDLE_OPEN_MENU":
      return {
        ...state,
        isOpenMenu: action.payload
      };
    case "HANDLE_OPEN_HIGHLIGHT":
      return {
        ...state,
        isOpenHighlight: action.payload
      };
    case "HANDLE_OPEN_NOTE":
      return {
        ...state,
        isOpenNote: action.payload
      };
    case "HANDLE_SELECTION":
      return {
        ...state,
        selection: action.payload
      };
    case "HANDLE_DIALOG_LOCATION":
      return {
        ...state,
        dialogLocation: action.payload
      };
    default:
      return state;
  }
}

export function handleOpenMenu(isOpenMenu) {
  console.log(isOpenMenu);
  return { type: "HANDLE_OPEN_MENU", payload: isOpenMenu };
}
export function handleOpenHighlight(isOpenHighlight) {
  return { type: "HANDLE_OPEN_HIGHLIGHT", payload: isOpenHighlight };
}
export function handleOpenNote(isOpenNote) {
  return { type: "HANDLE_OPEN_NOTE", payload: isOpenNote };
}
export function handleSelection(selection) {
  console.log("copy ");
  return { type: "HANDLE_SELECTION", payload: selection };
}
