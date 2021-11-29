export const settingList = [
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
    title: "Import books as link",
    desc: "The imported books will not be copied to library, only linked to the original book path",
    propName: "isImportPath",
  },
  {
    isElectron: true,
    title: "Merge reader into Word",
    desc: "Get rid of window frame, make reader hide into Word or any text editor, and can't be detected. You need to set up the reader's position, size and style first.",
    propName: "isMergeWord",
  },
  {
    isElectron: false,
    title: "Auto open last-read book",
    desc: "The book that you read from last time will be open automatically when launching",
    propName: "isOpenBook",
  },
  {
    isElectron: true,
    title: "Auto open book in fullscreen",
    desc: "Reader window will be maximized to fit the screen when opening a book",
    propName: "isAutoFullscreen",
  },
  {
    isElectron: false,
    title: "Default expand all content",
    desc: "All the folded content will be expanded in the navigation panel",
    propName: "isExpandContent",
  },
  {
    isElectron: true,
    title: "Disable screen blanking",
    desc: "When Koodo is running, your computer won't enter sleep mode",
    propName: "isPreventSleep",
  },
  {
    isElectron: true,
    title: "Open book without adding it to library",
    desc: "When opening books in the file manager with Koodo, the opened books won't be added to the library",
    propName: "isPreventAdd",
  },
  {
    isElectron: false,
    title: "Open books in the main window",
    desc: "Book won't be opened in a seperate window but directly opened in the main window",
    propName: "isOpenInMain",
  },
  {
    isElectron: true,
    title: "Disable update notification",
    propName: "isDisableUpdate",
  },
  {
    isElectron: false,
    title: "Disable analytics service",
    propName: "isDisableAnalytics",
  },
  {
    isElectron: false,
    title: "Turn on night mode",
    propName: "isDisplayDark",
  },
];
export const langList = [
  { label: "简体中文", value: "zh" },
  { label: "繁體中文", value: "cht" },
  { label: "English", value: "en" },
  { label: "русский", value: "ru" },
];

export const searchList = [
  { label: "Google", value: "google" },
  { label: "Baidu", value: "baidu" },
  { label: "Bing", value: "bing" },
  { label: "DuckDuckGo", value: "duckduckgo" },
  { label: "Yandex", value: "yandex" },
  { label: "Yahoo", value: "yahoo" },
];
export const readerSettingList = [
  {
    title: "Sliding Animation",
    propName: "isSliding",
  },
  {
    title: "Text Indent",
    propName: "isIndent",
  },
  {
    title: "Bold Font",
    propName: "isBold",
  },
  {
    title: "Italic",
    propName: "isItalic",
  },
  {
    title: "Text Underline",
    propName: "isUnderline",
  },
  {
    title: "Text Shadow",
    propName: "isShadow",
  },
  {
    title: "Invert color",
    propName: "isInvert",
  },
  {
    title: "Don't show footer",
    propName: "isHideFooter",
  },
  {
    title: "Don't show header",
    propName: "isHideHeader",
  },
  {
    title: "Dont't use mimical background",
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
];
