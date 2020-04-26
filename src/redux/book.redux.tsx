import BookModel from "../model/Book";
const initState = {
  isOpenEditDialog: false,
  isOpenDeleteDialog: false,
  isOpenAddDialog: false,
  isReading: false,
  currentBook: {},
  currentEpub: {},
};
export function book(
  state = initState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "HANDLE_EDIT_DIALOG":
      return {
        ...state,
        isOpenEditDialog: action.payload,
      };
    case "HANDLE_DELETE_DIALOG":
      return {
        ...state,
        isOpenDeleteDialog: action.payload,
      };
    case "HANDLE_ADD_DIALOG":
      return {
        ...state,
        isOpenAddDialog: action.payload,
      };
    case "HANDLE_READING_STATE":
      return {
        ...state,
        isReading: action.payload,
      };
    case "HANDLE_READING_BOOK":
      return {
        ...state,
        currentBook: action.payload,
      };

    case "HANDLE_READING_EPUB":
      return {
        ...state,
        currentEpub: action.payload,
      };
    case "HANDLE_REDIRECT":
      return {
        ...state,
        isRedirect: true,
      };
    default:
      return state;
  }
}

export function handleEditDialog(mode: boolean) {
  return { type: "HANDLE_EDIT_DIALOG", payload: mode };
}
export function handleDeleteDialog(mode: boolean) {
  return { type: "HANDLE_DELETE_DIALOG", payload: mode };
}
export function handleAddDialog(mode: boolean) {
  return { type: "HANDLE_ADD_DIALOG", payload: mode };
}
export function handleReadingState(state: boolean) {
  return { type: "HANDLE_READING_STATE", payload: state };
}
export function handleReadingBook(book: BookModel) {
  return { type: "HANDLE_READING_BOOK", payload: book };
}
export function handleReadingEpub(epub: any) {
  return { type: "HANDLE_READING_EPUB", payload: epub };
}
