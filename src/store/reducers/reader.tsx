import { ConfigService, HighlightUtil } from "../../assets/lib/kookit-extra-browser.min";
const highlightUtil = new HighlightUtil(ConfigService);
const initState = {
  bookmarks: [],
  notes: [],
  highlights: [],
  chapters: null,
  currentChapter: "",
  currentChapterIndex: 0,
  highlight: highlightUtil.getNoteHighlightValue(),
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
  originalSentence: "",
  quoteText: "",
  htmlBook: null,
  scale: ConfigService.getReaderConfig("scale") || "1",
  margin: ConfigService.getReaderConfig("margin") || "0",
  section: null,
  readerMode: "double",
  isConvertOpen: false,
  isPdfCropOpen: false,
  isSpeechOpen: false,
  isAnnotationOpen: false,
  speechStartText: "",
  isSpeechAutoStart: false,
  isNavLocked: ConfigService.getReaderConfig("isNavLocked") === "yes",
  isSettingLocked: ConfigService.getReaderConfig("isSettingLocked") === "yes",
  isHideFooter: ConfigService.getReaderConfig("isHideFooter") === "yes",
  isHideHeader: ConfigService.getReaderConfig("isHideHeader") === "yes",
  isHideBackground: ConfigService.getReaderConfig("isHideBackground") === "yes",
  isShowPageBorder: ConfigService.getReaderConfig("isShowPageBorder") === "yes",
  textOrientation: ConfigService.getReaderConfig("textOrientation") || "",
  jumpPosition: null as object | null,
  readerBackgroundImage:
    ConfigService.getReaderConfig("readerBackgroundImage") || "",
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
    case "HANDLE_HIGHLIGHTS":
      return {
        ...state,
        highlights: action.payload,
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
    case "HANDLE_PDF_CROP_DIALOG":
      return {
        ...state,
        isPdfCropOpen: action.payload,
      };
    case "HANDLE_SPEECH_DIALOG":
      return {
        ...state,
        isSpeechOpen: action.payload,
      };
    case "HANDLE_ANNOTATION_DIALOG":
      return {
        ...state,
        isAnnotationOpen: action.payload,
      };
    case "HANDLE_SPEECH_START_TEXT":
      return {
        ...state,
        speechStartText: action.payload,
      };
    case "HANDLE_SPEECH_AUTO_START":
      return {
        ...state,
        isSpeechAutoStart: action.payload,
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
    case "HANDLE_QUOTE_TEXT":
      return {
        ...state,
        quoteText: action.payload,
      };
    case "HANDLE_ORIGINAL_SENTENCE":
      return {
        ...state,
        originalSentence: action.payload,
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
    case "HANDLE_SHOW_BORDER":
      return {
        ...state,
        isShowPageBorder: action.payload,
      };
    case "HANDLE_TEXT_ORIENTATION":
      return {
        ...state,
        textOrientation: action.payload,
      };
    case "HANDLE_HTML_BOOK":
      return {
        ...state,
        htmlBook: action.payload,
      };
    case "HANDLE_HIGHLIGHT":
      return {
        ...state,
        highlight: action.payload,
      };
    case "HANDLE_BACKGROUND_COLOR":
      return {
        ...state,
        backgroundColor: action.payload,
      };
    case "HANDLE_READER_BACKGROUND_IMAGE":
      return {
        ...state,
        readerBackgroundImage: action.payload,
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
    case "HANDLE_JUMP_POSITION":
      return {
        ...state,
        jumpPosition: action.payload,
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
