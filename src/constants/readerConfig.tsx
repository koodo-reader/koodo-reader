export const themeList = [
  { id: 1, theme: "rgba(235,255,231,1)" },
  { id: 2, theme: "rgba(244,232,211,0.4)" },
  { id: 3, theme: "rgba(242,219,187,0.8)" },
  { id: 4, theme: "rgba(255,255,255,1)" },
  { id: 5, theme: "rgba(44,47,49,1)" },
];

export const updateLog = {
  date: "2020.9.29",
  version: "1.1.6",
  new: [
    "减少内存占用，提升首屏打开速度，优化多文件导入体验",
    "由于更改了文件存放方式，首次打开会有一次刷新",
    "滚动模式新增连续滚动和分章滚动",
    "单页模式下支持调节页面的缩放比例",
    "我的书架现在移动到全部图书的顶部",
    "支持删除书架和标签",
    "新增本次阅读时间，本章剩余时间",
    "页眉，页脚现在会显示当前页数，书名和章节名，如不需要，请前往设置关闭",
    "支持关闭图书的仿真背景，请前往设置关闭",
    "支持缩放、旋转、保存书中的图片",
  ],
  fix: [
    "解除之前的书籍大小和数量限制",
    "修复书签页崩溃的问题",
    "修复触控模式下的一些bug，点击边缘唤出菜单，再点击图书，退出菜单",
    "修复客户端无法最大化的问题",
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
      ? "https://reader.960960.xyz"
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
