export const settingList = [
  {
    isElectron: false,
    title: "Turn on touch screen mode",
    desc:
      "Reader menu will not be triggered by hovering but clicking on the area",
    propName: "isTouch",
  },
  {
    isElectron: false,
    title: "Auto open latest book",
    desc:
      "The book that you read from last time will be open automatically when launching",
    propName: "isOpenBook",
  },
  {
    isElectron: true,
    title: "Auto open book in fullscreen",
    desc:
      "Reader window will be maximized to fit the screen when opening a book",
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
    propName: "isUseBackground",
  },
  {
    title: "Hide navigation button",
    propName: "isHidePageButton",
  },
];
export const htmlSettingList = [
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
];
