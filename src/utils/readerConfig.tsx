import OtherUtil from "./otherUtil";

class readerConfig {
  // 为 iframe 添加默认的样式
  static addDefaultCss() {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let css = this.getDefaultCss();
    let style = doc.getElementById("default-style");
    let background = document.querySelector(".background");
    background!.setAttribute(
      "style",
      `background-color:${OtherUtil.getReaderConfig("theme")}`
    );
    if (!doc.head) {
      return;
    }
    if (!style) {
      style = doc.createElement("style");
      style.id = "default-style";
      style.textContent = css;
      doc.head.appendChild(style);
      return;
    }
    style.textContent = css;
  }
  // 获取为文档默认应用的css样式
  static getDefaultCss() {
    let colors = ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"];
    let lines = ["#FF0000", "#000080", "#0000FF", "#2EFF2E"];
    let css1 = `::selection{background:#f3a6a68c}::-moz-selection{background:#f3a6a68c}[class*=color-]:hover{cursor:pointer;background-image:linear-gradient(0,rgba(0,0,0,.075),rgba(0,0,0,.075))}.color-0{background-color:${colors[0]}}.color-1{background-color:${colors[1]}}.color-2{background-color:${colors[2]}}.color-3{background-color:${colors[3]}}.line-0{border-bottom:2px solid ${lines[0]}}.line-1{border-bottom:2px solid ${lines[1]}}.line-2{border-bottom:2px solid ${lines[2]}}.line-3{border-bottom:2px solid ${lines[3]}}}`;

    return css1;
  }
}
export const themeList = [
  { id: 1, theme: "rgba(235,255,231,1)" },
  { id: 2, theme: "rgba(244,232,211,0.4)" },
  { id: 3, theme: "rgba(242,219,187,0.8)" },
  { id: 4, theme: "rgba(255,254,252,1)" },
  { id: 5, theme: "rgba(44,47,49,1)" },
];

export const updateLog = {
  date: "2020.9.13",
  version: "1.1.5",
  new: [
    "新增听书功能",
    "增加对触控屏的支持，请前往设置->开启触控模式，阅读时双击页面唤出菜单，再双击退出，上下左右滑动控制翻页",
    "支持搜索笔记和书摘",
    "支持给笔记和书摘添加标签",
    "新增下划线标记功能",
    "新增黑色阅读主题",
    "支持收起多级目录",
    "支持自动打开上次阅读的图书，请前往设置->自动打开上次阅读的图书",
    "支持控制是否使用内嵌字体，请前往设置->使用内嵌字体",
    "客户端新增启动动画",
  ],
  fix: [
    "修复滚动模式下的一些bug",
    "修复备份恢复时的崩溃问题",
    "客户端启动时的性能优化",
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
export default readerConfig;
