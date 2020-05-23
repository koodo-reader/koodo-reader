const initState = {
  bookmarks: null,
  notes: null,
  digests: null,
  locations: null,
  chapters: null,
  highlighters: null,
  isSingle: localStorage.getItem("isSingle") || "double",
};
export function reader(
  state = initState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "HANDLE_BOOKMARKS":
      return {
        ...state,
        bookmarks: action.payload,
      };
    case "HANDLE_NOTES":
      return {
        ...state,
        notes: action.payload,
      };
    case "HANDLE_DIGESTS":
      return {
        ...state,
        digests: action.payload,
      };
    case "HANDLE_LOCATIONS":
      return {
        ...state,
        locations: action.payload,
      };
    case "HANDLE_SECTION":
      return {
        ...state,
        section: action.payload,
      };
    case "HANDLE_SINGLE":
      return {
        ...state,
        isSingle: action.payload,
      };
    case "HANDLE_CHAPTERS":
      return {
        ...state,
        chapters: action.payload,
      };
    case "HANDLE_HIGHLIGHTERS":
      return {
        ...state,
        highlighters: action.payload,
      };
    default:
      return state;
  }
}
