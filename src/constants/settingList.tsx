export const generalSettingList = [
  {
    isElectron: true,
    title: "Import books as link",
    desc: "The imported books will not be copied to library, only linked to the original book path",
    propName: "isImportPath",
  },

  {
    isElectron: false,
    title: "Disable trash bin",
    desc: "When deleting books, they will be deleted permanently instead of sending to trash bin",
    propName: "isDisableTrashBin",
  },
  {
    isElectron: false,
    title: "Hide books already added to the shelf",
    desc: "Hide books which have been added to the shelf, so they won't show up in home page",
    propName: "isHideShelfBook",
  },
  {
    isElectron: false,
    title: "Delete book from shelf also deleting book itself",
    desc: "When deleting book from shelf, the book will be deleted as well",
    propName: "isDeleteShelfBook",
  },
  {
    isElectron: true,
    title: "Disable screen blanking",
    desc: "When Koodo is running, your computer won't enter sleep mode",
    propName: "isPreventSleep",
  },
  {
    isElectron: true,
    title: "Windows always on top",
    propName: "isAlwaysOnTop",
  },
  {
    isElectron: true,
    title: "Automatically launch on system startup",
    propName: "isAutoLaunch",
  },
  {
    isElectron: true,
    title: "Open book without adding it to library",
    desc: "When opening books in the file manager with Koodo, the opened books won't be added to the library",
    propName: "isPreventAdd",
  },

  {
    isElectron: false,
    title: "Auto precache books after import",
    desc: "Pre-cache books after import to increase opening speed, Koodo will generate a precache version of the original book and save it into your library",
    propName: "isPrecacheBook",
  },
  {
    isElectron: true,
    title: "Disable update notification",
    propName: "isDisableUpdate",
  },
  {
    isElectron: true,
    title: "Open url with built-in browser",
    propName: "isUseBuiltIn",
  },
];
export const appearanceSettingList = [
  {
    isElectron: false,
    title: "Don't use first page as PDF cover",
    desc: "",
    propName: "isDisablePDFCover",
  },
  {
    isElectron: false,
    title: "Don't crop book cover",
    propName: "isDisableCrop",
  },
  {
    isElectron: false,
    title: "Disable pagination in book list",
    propName: "isDisablePagination",
  },
];
export const syncSettingList = [
  {
    isElectron: false,
    title: "Disable automatic sync",
    desc: "By default, Koodo Reader will automatically synchronize your data when you open the app and exit reading",
    propName: "isDisableAutoSync",
  },
  {
    isElectron: false,
    title: "Enable Koodo Sync",
    desc: "Enable this option to increase synchronization speed. Your reading progress, notes, highlights, bookmarks, and other reading-related data will be stored and synced via our cloud service, your books and covers will still be synced by your added data sources. Turning off this option will remove the above data from our cloud.",
    propName: "isEnableKoodoSync",
  },
  {
    isElectron: false,
    title: "Always keep local data when resolving sync conflicts",
    desc: "If you update a piece of data that has already been deleted in the cloud before synchronization, it will cause a conflict. In this case, we will keep the cloud data by default. If you turn this option on, we will keep the local data",
    propName: "isKeepLocal",
  },
];
export const readingSettingList = [
  {
    isElectron: false,
    title: "Turn on touch screen mode",
    desc: "Gesture and UI optimization for touch screen",
    propName: "isTouch",
  },
  {
    isElectron: false,
    title: "Prevent accidental trigger",
    desc: "Reader menu will not be triggered by hovering but clicking on the area",
    propName: "isPreventTrigger",
  },
  {
    isElectron: true,
    title: "Merge reader into Word",
    desc: "Get rid of window frame, make reader hide into Word or any text editor, and can't be detected. You need to set up the reader's position, size and style first.",
    propName: "isMergeWord",
  },
  {
    isElectron: true,
    title: "Open books in the main window",
    desc: "Book won't be opened in a separate window but directly opened in the main window",
    propName: "isOpenInMain",
  },
  {
    isElectron: false,
    title: "Auto open last-read book",
    desc: "The book that you read from last time will be open automatically when launching",
    propName: "isOpenBook",
  },
  {
    isElectron: true,
    title: "Auto open book in full screen",
    desc: "Reader window will be maximized to fit the screen when opening a book",
    propName: "isAutoFullscreen",
  },
  {
    isElectron: false,
    title: "Auto expand content",
    desc: "All the folded content will be expanded in the navigation panel",
    propName: "isExpandContent",
  },
  {
    isElectron: false,
    title: "No popup when selecting texts",
    desc: "Turn it on when you want Koodo to work with other third-party translation service, right clicking on the selected text will trigger popup again",
    propName: "isDisablePopup",
  },
  {
    isElectron: false,
    title: "Overwrite the default link style in the book",
    propName: "isOverwriteLink",
  },
  // {
  //   isElectron: true,
  //   title: "Lemmatize words when looking up in a dictionary",
  //   desc: "To reduce the different forms of a word to one single form, for example, reducing builds, building or built to build, reducing cats to cat, reducing fastest to fast",
  //   propName: "isLemmatizeWord",
  // },
];

export const langList = [
  { label: "简体中文", value: "zhCN" },
  { label: "繁體中文", value: "zhTW" },
  { label: "繁體中文-澳門", value: "zhMO" },
  { label: "English", value: "en" },
  { label: "Pусский", value: "ru" },
  { label: "Español", value: "es" },
  { label: "Français", value: "fr" },
  { label: "Português", value: "ptBR" },
  { label: "فارسی", value: "fa" },
  { label: "日本語", value: "ja" },
  { label: "Türkçe", value: "tr" },
  { label: "عربي", value: "ar" },
  { label: "čeština", value: "cs" },
  { label: "Deutsch", value: "de" },
  { label: "한국어", value: "ko" },
  { label: "Polski", value: "pl" },
  { label: "Română", value: "ro" },
  { label: "แบบไทย", value: "th" },
  { label: "italiano", value: "it" },
  { label: "Nederlands", value: "nl" },
  { label: "বাংলা", value: "bn" },
  { label: "български", value: "bg" },
  { label: "bahasa Indonesia", value: "id" },
  { label: "հայերեն", value: "hy" },
  { label: "བོད་སྐད།", value: "bo" },
  { label: "हिंदी", value: "hi" },
  { label: "Magyar", value: "hu" },
  { label: "Gaeilge", value: "ga" },
  { label: "Svenska", value: "sv" },
  { label: "Tagalog", value: "tl" },
  { label: "Slovenščina", value: "sl" },
  { label: "Srpski", value: "sr" },
  { label: "Українська", value: "uk" },
];

export const searchList = [
  { label: "Google", value: "google" },
  { label: "Baidu", value: "baidu" },
  { label: "Bing", value: "bing" },
  { label: "DuckDuckGo", value: "duckduckgo" },
  { label: "Yandex", value: "yandex" },
  { label: "Yahoo", value: "yahoo" },
  { label: "Naver", value: "naver" },
  { label: "Baidu Baike", value: "baike" },
  { label: "Wikipedia", value: "wiki" },
];
export const skinList = [
  { label: "Follow OS", value: "system" },
  { label: "Light mode", value: "light" },
  { label: "Night mode", value: "night" },
];

export const readerSettingList = [
  {
    title: "Sliding animation",
    propName: "isSliding",
  },
  {
    title: "Render PDF from even page",
    propName: "isStartFromEven",
  },
  {
    title: "Text indentation",
    propName: "isIndent",
  },
  {
    title: "Bold",
    propName: "isBold",
  },
  {
    title: "Italic",
    propName: "isItalic",
  },
  {
    title: "Underline",
    propName: "isUnderline",
  },
  {
    title: "Shadow",
    propName: "isShadow",
  },
  {
    title: "Invert color",
    propName: "isInvert",
  },
  {
    title: "Hide footer",
    propName: "isHideFooter",
  },
  {
    title: "Hide header",
    propName: "isHideHeader",
  },
  {
    title: "Hide mimical background",
    propName: "isHideBackground",
  },
  {
    title: "Hide navigation button",
    propName: "isHidePageButton",
  },
  {
    title: "Hide menu button",
    propName: "isHideMenuButton",
  },
  {
    title: "Hide AI button",
    propName: "isHideAIButton",
  },
];
export const officialTranList = {
  English: "English",
  "Simplified Chinese": "Simplified Chinese",
  "Traditional Chinese": "Traditional Chinese",
  Japanese: "Japanese",
  Korean: "Korean",
  French: "French",
  German: "German",
  Spanish: "Spanish",
  Italian: "Italian",
  Russian: "Russian",
  Portuguese: "Portuguese",
};
export const officialDictList = [
  { lang: "English", code: "eng", nativeLang: "English" },
  { lang: "Simplified Chinese", code: "chs", nativeLang: "Simplified Chinese" },
  {
    lang: "Traditional Chinese",
    code: "cht",
    nativeLang: "Traditional Chinese",
  },
  { lang: "Japanese", code: "jpn", nativeLang: "Japanese" },
  { lang: "Korean", code: "kor", nativeLang: "Korean" },
  { lang: "French", code: "fra", nativeLang: "French" },
  { lang: "German", code: "deu", nativeLang: "German" },
  { lang: "Spanish", code: "spa", nativeLang: "Spanish" },
  { lang: "Italian", code: "ita", nativeLang: "Italian" },
  { lang: "Russian", code: "rus", nativeLang: "Russian" },
  { lang: "Portuguese", code: "por", nativeLang: "Portuguese" },
  {
    lang: "Classical Chinese",
    code: "ancient",
    nativeLang: "Classical Chinese",
  },
];
export const sampleQuestion = [
  {
    mode: "ask",
    question: "Summarize this chapter for me",
  },
  {
    mode: "ask",
    question: "What are the key points of this chapter",
  },
  {
    mode: "chat",
    question: "Recommend me some books from Colleen Hoover",
  },
  {
    mode: "chat",
    question: "Explain Stoicism and its principles to me",
  },
];
