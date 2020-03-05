const initState = {
  isOpenEditDialog: false,
  isOpenDeleteDialog: false,
  isOpenAddDialog: false,
  isReading: false,
  currentBook: {},
  currentEpub: {},
  isRedirect: false
  // cover:''
};
export function book(state = initState, action) {
  switch (action.type) {
    case "HANDLE_EDIT_DIALOG":
      return {
        ...state,
        isOpenEditDialog: action.payload
      };
    case "HANDLE_DELETE_DIALOG":
      return {
        ...state,
        isOpenDeleteDialog: action.payload
      };
    case "HANDLE_ADD_DIALOG":
      return {
        ...state,
        isOpenAddDialog: action.payload
      };
    case "HANDLE_READING_STATE":
      return {
        ...state,
        isReading: action.payload
      };
    case "HANDLE_READING_BOOK":
      return {
        ...state,
        currentBook: action.payload
      };

    case "HANDLE_READING_EPUB":
      return {
        ...state,
        currentEpub: action.payload
      };
    case "HANDLE_REDIRECT":
      return {
        ...state,
        isRedirect: true
      };
    default:
      return state;
  }
}

export function handleEditDialog(mode) {
  return { type: "HANDLE_EDIT_DIALOG", payload: mode };
}
export function handleDeleteDialog(mode) {
  return { type: "HANDLE_DELETE_DIALOG", payload: mode };
}
export function handleAddDialog(mode) {
  return { type: "HANDLE_ADD_DIALOG", payload: mode };
}
export function handleReadingState(state) {
  return { type: "HANDLE_READING_STATE", payload: state };
}
export function handleReadingBook(book) {
  return { type: "HANDLE_READING_BOOK", payload: book };
}
export function handleReadingEpub(epub) {
  return { type: "HANDLE_READING_EPUB", payload: epub };
}

export function handleRedirect() {
  return { type: "HANDLE_REDIRECT" };
}
