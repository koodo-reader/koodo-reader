const initState = {
  books: null,
  epubs: null,
  covers: null,
  searchBooks: [],
  isSearch: false,
  isSort: false,
  isFirst: "no",
  isList: "card",
  isSortDisplay: false,
  sortCode: { sort: 2, order: 2 },
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
    case "HANDLE_SEARCH_BOOKS":
      return {
        ...state,
        searchBooks: action.payload,
      };
    case "HANDLE_SEARCH":
      return {
        ...state,
        isSearch: action.payload,
      };
    case "HANDLE_SORT":
      return {
        ...state,
        isSort: action.payload,
      };
    case "HANDLE_FIRST":
      return {
        ...state,
        isFirst: action.payload,
      };
    case "HANDLE_LIST":
      return {
        ...state,
        isList: action.payload,
      };
    case "HANDLE_SORT_DISPLAY":
      return {
        ...state,
        isSortDisplay: action.payload,
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
        sortCode: { sort: action.payload.sort, order: action.payload.order },
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
    case "HANDLE_EPUBS":
      return {
        ...state,
        epubs: action.payload,
      };
    case "HANDLE_COVERS":
      return {
        ...state,
        covers: action.payload,
      };

    default:
      return state;
  }
}
