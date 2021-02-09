import OtherUtil from "../../utils/otherUtil";
const initState = {
  books: null,
  deletedBooks: [],
  searchResults: [],
  isSearch: false,
  isBookSort: false,
  isNoteSort: false,
  isSettingOpen: false,
  viewMode: "card",
  isSortDisplay: false,
  isShowLoading: false,
  isDownloadDesk: false,
  isShowNew: false,
  bookSortCode: { sort: 0, order: 1 },
  noteSortCode: OtherUtil.getNoteSortCode(),
  isMessage: false,
  message: "Add Successfully",
};
export function manager(
  state = initState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "HANDLE_BOOKS":
      return {
        ...state,
        books: action.payload,
      };
    case "HANDLE_DELETED_BOOKS":
      return {
        ...state,
        deletedBooks: action.payload,
      };
    case "HANDLE_SEARCH_BOOKS":
      return {
        ...state,
        searchResults: action.payload,
      };
    case "HANDLE_DOWNLOAD_DESK":
      return {
        ...state,
        isDownloadDesk: action.payload,
      };
    case "HANDLE_SEARCH":
      return {
        ...state,
        isSearch: action.payload,
      };
    case "HANDLE_SETTING":
      return {
        ...state,
        isSettingOpen: action.payload,
      };
    case "HANDLE_BOOK_SORT":
      return {
        ...state,
        isBookSort: action.payload,
      };
    case "HANDLE_NOTE_SORT":
      return {
        ...state,
        isNoteSort: action.payload,
      };

    case "HANDLE_VIEW_MODE":
      return {
        ...state,
        viewMode: action.payload,
      };
    case "HANDLE_SORT_DISPLAY":
      return {
        ...state,
        isSortDisplay: action.payload,
      };
    case "HANDLE_SHOW_LOADING":
      return {
        ...state,
        isShowLoading: action.payload,
      };
    case "HANDLE_SHOW_NEW":
      return {
        ...state,
        isShowNew: action.payload,
      };
    case "HANDLE_MESSAGE":
      return {
        ...state,
        message: action.payload,
      };
    case "HANDLE_MESSAGE_BOX":
      return {
        ...state,
        isMessage: action.payload,
      };
    case "HANDLE_SORT_CODE":
      return {
        ...state,
        bookSortCode: {
          sort: action.payload.sort,
          order: action.payload.order,
        },
      };
    case "HANDLE_NOTE_SORT_CODE":
      return {
        ...state,
        noteSortCode: {
          sort: action.payload.sort,
          order: action.payload.order,
        },
      };
    case "HANDLE_NOTES":
      return {
        ...state,
        notes: action.payload,
      };
    case "HANDLE_BOOKMARKS":
      return {
        ...state,
        bookmarks: action.payload,
      };

    default:
      return state;
  }
}
