const initState = {
  isOpenEditDialog: false,
  isOpenDeleteDialog: false,
  isOpenAddDialog: false,
  isOpenActionDialog: false,
  isReading: false,
  dragItem: "",
  currentBook: {},
  currentPage: 1,
  totalPage: 1,
  renderBookFunc: () => {},
  importBookFunc: () => {},
  renderNoteFunc: () => {},
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
    case "HANDLE_CURRENT_PAGE":
      return {
        ...state,
        currentPage: action.payload,
      };
    case "HANDLE_RENDER_BOOK_FUNC":
      return {
        ...state,
        renderBookFunc: action.payload,
      };
    case "HANDLE_IMPORT_BOOK_FUNC":
      return {
        ...state,
        importBookFunc: action.payload,
      };
    case "HANDLE_RENDER_NOTE_FUNC":
      return {
        ...state,
        renderNoteFunc: action.payload,
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
    case "HANDLE_TOTAL_PAGE":
      return {
        ...state,
        totalPage: action.payload,
      };
    case "HANDLE_READING_BOOK":
      return {
        ...state,
        currentBook: action.payload,
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
