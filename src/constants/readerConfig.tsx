export const themeList = [
  { id: 1, theme: "rgba(235,255,231,1)" },
  { id: 2, theme: "rgba(244,232,211,0.4)" },
  { id: 3, theme: "rgba(242,219,187,0.8)" },
  { id: 4, theme: "rgba(255,255,255,1)" },
  { id: 5, theme: "rgba(44,47,49,1)" },
];

export const updateLog = {
  date: "2020.10.18",
  version: "1.1.7",
  new: [
    "增加对pdf格式的支持，暂不支持笔记，书签等功能",
    "增加对mobi格式的支持，仅客户端支持，暂不支持图片功能",
    "增加对txt格式的支持，仅客户端支持",
    "使用 React Router 重构代码",
    "进一步减少内存占用",
    "设置新增是否默认展开所有目录",
    "网页版支持同时打开多本图书",
    "客户端打开图书时，窗口自动最大化",
  ],
  fix: [
    "修复多级目录无法展开的问题",
    "修复字体，字体大小换章失效的问题",
    "修复进度条无法跳转的问题",
    "修复英文界面的排版问题",
  ],
};

export const dropdownList = [
  {
    id: 1,
    title: "Font Family",
    value: "fontFamily",
    option: [
      "Helvetica",
      "Times New Roman",
      "Microsoft YaHei",
      "SimSun",
      "SimHei",
      "Arial",
    ],
  },
  {
    id: 2,
    title: "Line Height",
    value: "lineHeight",
    option: ["1.25", "1", "1.25", "1.5", "1.75", "2"],
  },
];
export const sideMenu = [
  {
    name: "All Books",
    icon: "home",
    mode: "home",
  },
  {
    name: "My Favorites",
    icon: "love",
    mode: "favorite",
  },
  {
    name: "My Bookmarks",
    icon: "bookmark",
    mode: "bookmark",
  },
  {
    name: "My Notes",
    icon: "idea",
    mode: "note",
  },

  {
    name: "My Digests",
    icon: "digest",
    mode: "digest",
  },
];
export const config = {
  callback_url:
    process.env.NODE_ENV === "production"
      ? "https://koodo.960960.xyz"
      : "http://localhost:3000",
  token_url:
    process.env.NODE_ENV === "production"
      ? "http://localhost:3366"
      : "http://localhost:3366",
  dropbox_client_id: "e3zgg310xbizvaf",
  googledrive_client_id:
    "99440516227-ifr1ann33f2j610i3ri17ej0i51c7m6e.apps.googleusercontent.com",
  onedrive_client_id: "ac96f9bf-94f2-49c0-8418-999b919bc236",
};
export const driveList = [
  {
    id: 1,
    name: "Local",
    icon: "local",
    url: "",
  },
  {
    id: 2,
    name: "Dropbox",
    icon: "dropbox",
    url: `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${config.dropbox_client_id}&redirect_uri=${config.callback_url}`,
  },

  {
    id: 3,
    name: "Google Drive",
    icon: "googledrive",
    url: "",
  },
  {
    id: 4,
    name: "OneDrive",
    icon: "onedrive",
    url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.onedrive_client_id}&scope=files.readwrite offline_access&response_type=code&redirect_uri=${config.callback_url}`,
  },
  {
    id: 5,
    name: "WebDav",
    icon: "webdav",
    url: "",
  },
];
export const emptyList = [
  {
    mode: "home",
    main: "Empty Library",
    sub: "Click the top-right button to add books",
  },
  {
    mode: "favorite",
    main: "No Favorite Books",
    sub:
      "Move your mouse on the top of any book, click the heart icon to add it to your favorite books",
  },
  {
    mode: "bookmark",
    main: "Empty Bookmark",
    sub: "Move your mouse on the top edge of the reader",
  },
  {
    mode: "note",
    main: "Empty Note",
    sub: "Select any text and click the Add-Note button on the popup Menu",
  },
  {
    mode: "digest",
    main: "Empty Digest",
    sub: "Select any text and click the Collect button on the popup Menu",
  },
  {
    mode: "shelf",
    main: "Empty Shelf",
    sub: "Move your mouse on the top of any book",
  },
];
export const welcomeMessage = [
  {
    main: "This is a free and open-source Epub reader",
    sub:
      "Koodo Reader works on multiple platforms with backup and restore support",
  },
  {
    main: "For better reading experience",
    sub:
      "Supports for theme changing, reading history, book managerment, shelf managerment and more",
  },
  {
    main: "Fluent and easy operation",
    sub:
      "Move your mouse to the edge of the reader to trigger menu,use mouse wheel and keyborad to switch pages",
  },
  {
    main: "Go to Add your first book",
    sub: "That's all for the tutorial",
  },
];
