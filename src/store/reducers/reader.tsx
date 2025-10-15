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
  isHideFooter: ConfigService.getReaderConfig("isHideFooter") === "yes",
  isHideHeader: ConfigService.getReaderConfig("isHideHeader") === "yes",
  isHideBackground: ConfigService.getReaderConfig("isHideBackground") === "yes",
  isHidePageButton: ConfigService.getReaderConfig("isHidePageButton") === "yes",
  isHideMenuButton: ConfigService.getReaderConfig("isHideMenuButton") === "yes",
  isHideAIButton: ConfigService.getReaderConfig("isHideAIButton") === "yes",
  isHideScaleButton:
    ConfigService.getReaderConfig("isHideScaleButton") === "yes",
  isHidePDFConvertButton:
    ConfigService.getReaderConfig("isHidePDFConvertButton") === "yes",
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
    case "HANDLE_HIDE_FOOTER":
      return {
        ...state,
        isHideFooter: action.payload,
      };
    case "HANDLE_HIDE_HEADER":
      return {
        ...state,
        isHideHeader: action.payload,
      };
    case "HANDLE_HIDE_BACKGROUND":
      return {
        ...state,
        isHideBackground: action.payload,
      };
    case "HANDLE_HIDE_PAGE_BUTTON":
      return {
        ...state,
        isHidePageButton: action.payload,
      };
    case "HANDLE_HIDE_MENU_BUTTON":
      return {
        ...state,
        isHideMenuButton: action.payload,
      };
    case "HANDLE_HIDE_AI_BUTTON":
      return {
        ...state,
        isHideAIButton: action.payload,
      };
    case "HANDLE_HIDE_SCALE_BUTTON":
      return {
        ...state,
        isHideScaleButton: action.payload,
      };
    case "HANDLE_HIDE_PDF_CONVERT_BUTTON":
      return {
        ...state,
        isHidePDFConvertButton: action.payload,
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
