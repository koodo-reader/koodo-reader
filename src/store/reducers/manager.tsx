import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

const initState = {
  books: null,
  plugins: null,
  deletedBooks: [],
  searchResults: [],
  isSearch: false,
  isOpenFeedbackDialog: false,
  isAboutOpen: false,
  isBookSort: ConfigService.getItem("bookSortCode") ? true : false,
  isNoteSort: false,
  isAuthed: false,
  userInfo: null,
  isSettingOpen: false,
  viewMode: "card",
  isSortDisplay: false,
  isShowLoading: false,
  isNewWarning: false,
  isTipDialog: false,
  isDetailDialog: false,
  isShowNew: false,
  bookSortCode: { sort: 1, order: 2 },
  noteSortCode: { sort: 2, order: 2 },
  isSelectBook: false,
  message: "Addition successful",
  settingMode: "general",
  settingDrive: "",
  tip: "",
  selectedBooks: [],
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
    case "HANDLE_PLUGINS":
      return {
        ...state,
        plugins: action.payload,
      };
    case "HANDLE_DELETED_BOOKS":
      return {
        ...state,
        deletedBooks: action.payload,
      };
    case "HANDLE_FEEDBACK_DIALOG":
      return {
        ...state,
        isOpenFeedbackDialog: action.payload,
      };
    case "HANDLE_USER_INFO":
      return {
        ...state,
        userInfo: action.payload,
      };
    case "HANDLE_SETTING_MODE":
      return {
        ...state,
        settingMode: action.payload,
      };
    case "HANDLE_SETTING_DRIVE":
      return {
        ...state,
        settingDrive: action.payload,
      };
    case "HANDLE_SEARCH_BOOKS":
      return {
        ...state,
        searchResults: action.payload,
      };
    case "HANDLE_SELECT_BOOK":
      return {
        ...state,
        isSelectBook: action.payload,
      };
    case "HANDLE_AUTHED":
      return {
        ...state,
        isAuthed: action.payload,
      };
    case "HANDLE_SELECTED_BOOKS":
      return {
        ...state,
        selectedBooks: action.payload,
      };
    case "HANDLE_TIP_DIALOG":
      return {
        ...state,
        isTipDialog: action.payload,
      };
    case "HANDLE_DETAIL_DIALOG":
      return {
        ...state,
        isDetailDialog: action.payload,
      };
    case "HANDLE_TIP":
      return {
        ...state,
        tip: action.payload,
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
    case "HANDLE_ABOUT":
      return {
        ...state,
        isAboutOpen: action.payload,
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
    case "HANDLE_NEW_WARNING":
      return {
        ...state,
        isNewWarning: action.payload,
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
