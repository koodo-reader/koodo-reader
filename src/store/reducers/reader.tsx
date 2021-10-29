import StorageUtil from "../../utils/storageUtil";
const initState = {
  bookmarks: [],
  notes: [],
  digests: [],
  chapters: null,
  currentChapter: "",
  flattenChapters: null,

  color: parseInt(StorageUtil.getReaderConfig("highlightIndex"))
    ? parseInt(StorageUtil.getReaderConfig("highlightIndex"))
    : StorageUtil.getReaderConfig("isDisplayDark") === "yes"
    ? 3
    : 0,
  noteKey: "",
  originalText: "",
  htmlBook: null,
  readerMode: StorageUtil.getReaderConfig("readerMode") || "double",
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
    case "HANDLE_CURRENT_CHAPTER":
      return {
        ...state,
        currentChapter: action.payload,
      };
    case "HANDLE_ORIGINAL_TEXT":
      return {
        ...state,
        originalText: action.payload,
      };
    case "HANDLE_HTML_BOOK":
      return {
        ...state,
        htmlBook: action.payload,
      };
    case "HANDLE_COLOR":
      return {
        ...state,
        color: action.payload,
      };

    case "HANDLE_NOTE_KEY":
      return {
        ...state,
        noteKey: action.payload,
      };
    case "HANDLE_DIGESTS":
      return {
        ...state,
        digests: action.payload,
      };
    case "HANDLE_SECTION":
      return {
        ...state,
        section: action.payload,
      };
    case "HANDLE_CHAPTERS":
      return {
        ...state,
        chapters: action.payload,
      };
    case "HANDLE_FLATTEN_CHAPTERS":
      return {
        ...state,
        flattenChapters: action.payload,
      };
    default:
      return state;
  }
}
