const initState = {
  isOpenEditDialog: false,
  isOpenDeleteDialog: false,
  isOpenAddDialog: false,
  isOpenActionDialog: false,
  isReading: false,
  dragItem: "",
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
    case "HANDLE_ACTION_DIALOG":
      return {
        ...state,
        isOpenActionDialog: action.payload,
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
    case "HANDLE_DRAG_ITEM":
      return {
        ...state,
        dragItem: action.payload,
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
