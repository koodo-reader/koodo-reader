import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
const initState = {
  bookmarks: [],
  notes: [],
  chapters: null,
  currentChapter: "",
  currentChapterIndex: 0,
  color: parseInt(ConfigService.getReaderConfig("highlightIndex"))
    ? parseInt(ConfigService.getReaderConfig("highlightIndex"))
    : ConfigService.getReaderConfig("appSkin") === "night" ||
      (ConfigService.getReaderConfig("appSkin") === "system" &&
        ConfigService.getReaderConfig("isOSNight") === "yes")
    ? 3
    : 0,
  backgroundColor:
    ConfigService.getReaderConfig("isMergeWord") === "yes"
      ? "rgba(0,0,0,0)"
      : ConfigService.getReaderConfig("backgroundColor")
      ? ConfigService.getReaderConfig("backgroundColor")
      : ConfigService.getReaderConfig("appSkin") === "night" ||
        (ConfigService.getReaderConfig("appSkin") === "system" &&
          ConfigService.getReaderConfig("isOSNight") === "yes")
      ? "rgba(44,47,49,1)"
      : "rgba(255,255,255,1)",
  noteKey: "",
  originalText: "",
  htmlBook: null,
  scale: ConfigService.getReaderConfig("scale") || "1",
  margin: ConfigService.getReaderConfig("margin") || "0",
  section: null,
  readerMode: "double",
  isConvertOpen: false,
  isNavLocked: ConfigService.getReaderConfig("isNavLocked") === "yes",
  isSettingLocked: ConfigService.getReaderConfig("isSettingLocked") === "yes",
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
    case "HANDLE_CONVERT_DIALOG":
      return {
        ...state,
        isConvertOpen: action.payload,
      };
    case "HANDLE_CURRENT_CHAPTER_INDEX":
      return {
        ...state,
        currentChapterIndex: action.payload,
      };
    case "HANDLE_ORIGINAL_TEXT":
      return {
        ...state,
        originalText: action.payload,
      };
    case "HANDLE_NAV_LOCK":
      return {
        ...state,
        isNavLocked: action.payload,
      };
    case "HANDLE_SETTING_LOCK":
      return {
        ...state,
        isSettingLocked: action.payload,
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
    case "HANDLE_BACKGROUND_COLOR":
      return {
        ...state,
        backgroundColor: action.payload,
      };
    case "HANDLE_NOTE_KEY":
      return {
        ...state,
        noteKey: action.payload,
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
    case "HANDLE_READER_MODE":
      return {
        ...state,
        readerMode: action.payload,
      };
    case "HANDLE_SCALE":
      return {
        ...state,
        scale: action.payload,
      };
    case "HANDLE_MARGIN":
      return {
        ...state,
        margin: action.payload,
      };
    default:
      return state;
  }
}
