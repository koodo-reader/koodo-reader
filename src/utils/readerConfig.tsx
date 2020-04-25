class readerConfig {
  // 获取默认的配置
  // static getDefaultConfigObj() {
  //   return {
  //     theme: "rgba(255,254,252,1)",
  //     fontFamily: "Helvetica",
  //     fontSize: "17", // 0 代表使用默认值
  //     lineHeight: "1.25", // 0 代表使用默认值
  //     padding: "50", // 阅读区域与浏览器可视区域上下的间距
  //     progress: 0,
  //     colors: ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"],
  //   };
  // }

  // 更新config
  // 为 iframe 添加默认的样式
  static addDefaultCss() {
    let css = this.getDefaultCss();
    let iDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    let style = iDoc.getElementById("default-style");
    let background = document.querySelector(".background");
    background.setAttribute(
      "style",
      `background-color:${localStorage.getItem("theme")}`
    );

    if (!style) {
      style = iDoc.createElement("style");
      style.id = "default-style";
      style.textContent = css;
      iDoc.head.appendChild(style);
      return;
    }
    style.textContent = css;
  }
  // 获取为文档默认应用的css样式
  static getDefaultCss() {
    let colors = ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"];
    let css1 = `::selection{background:#f3a6a68c}::-moz-selection{background:#f3a6a68c}[class*=color-]:hover{cursor:pointer;background-image:linear-gradient(0,rgba(0,0,0,.075),rgba(0,0,0,.075))}.color-0{background-color:${colors[0]}}.color-1{background-color:${colors[1]}}.color-2{background-color:${colors[2]}}.color-3{background-color:${colors[3]}}`;
    let css2 = [
      "a, article, cite, code, div, li, p, pre, span, table {",
      `    font-size: ${
        localStorage.getItem("fontSize") || "17" + "px"
      } !important;`,
      `    line-height: ${
        localStorage.getItem("lineHeight") || "1.25"
      } !important;`,
      `    font-family: "${
        localStorage.getItem("fontFamily") || "Helvetica"
      }" !important;`,
      "}",
      "img {",
      "    max-width: 100% !important;",
      "}",
    ];
    return css1 + css2.join("\n");
  }
}
export const themeList = [
  { id: 1, theme: "rgba(235,255,231,1)" },
  { id: 2, theme: "rgba(244, 232, 211,0.4)" },
  { id: 3, theme: "rgba(242,219,187,0.8)" },
  { id: 4, theme: "rgba(255,254,252,1)" },
];
export const fontSizeList = [
  { id: 1, size: "小", value: "15" },
  { id: 2, size: "中", value: "17" },
  { id: 3, size: "大", value: "20" },
  { id: 4, size: "特大", value: "23" },
  { id: 5, size: "超大", value: "26" },
];
export const dropdownList = [
  {
    id: 1,
    title: "字体",
    value: "fontFamily",

    option: [
      { id: 1, name: "默认(Helvetica)", value: "Helvetica" },
      { id: 2, name: "微软雅黑", value: "Microsoft Yahei" },
      { id: 3, name: " 苹方字体", value: " Arial" },
      { id: 4, name: "冬青黑体", value: "Hiragino Sans GB" },
      { id: 5, name: "黑体", value: "Heiti SC" },
      { id: 6, name: "Aril", value: "Aril" },
    ],
  },
  {
    id: 2,
    title: "行间距",
    value: "lineHeight",

    option: [
      { id: 1, name: "默认(1.25倍)", value: "1.25" },
      { id: 2, name: "1倍", value: "1" },
      {
        id: 3,
        name: "1.25倍",
        value: "1.25",
      },
      { id: 4, name: "1.5倍", value: "1.5" },
      {
        id: 5,
        name: "1.75倍",
        value: "1.75",
      },
      { id: 6, name: "2倍", value: "2" },
    ],
  },
];
export const sideMenu = [
  {
    name: "全部图书",
    icon: "home",
    mode: "home",
  },
  {
    name: "最近阅读",
    icon: "recent",
    mode: "recent",
  },
  {
    name: "我的书签",
    icon: "bookmark",
    mode: "bookmark",
  },
  {
    name: "我的笔记",
    icon: "idea",
    mode: "note",
  },

  {
    name: "我的书摘",
    icon: "digest",
    mode: "digest",
  },
];
export const driveList = [
  {
    id: 1,
    name: "本地",
    icon: "local",
  },
  {
    id: 2,
    name: "Dropbox",
    icon: "dropbox",
  },
  {
    id: 3,
    name: "OneDrive",
    icon: "onedrive",
  },
  {
    id: 4,
    name: "Google Drive",
    icon: "googledrive",
  },
  {
    id: 5,
    name: "WebDav",
    icon: "webdav",
  },
];
export const emptyList = [
  {
    mode: "home",
    main: "您的图书库为空",
    sub: "请点击右上角的图标添加图书",
  },
  {
    mode: "recent",
    main: "您没有阅读记录",
    sub: "点击任意一本书开始阅读",
  },
  {
    mode: "bookmark",
    main: "您的书签为空",
    sub: "在阅读器界面，将鼠标移至上边缘处，在弹出的菜单栏中添加书签",
  },
  {
    mode: "note",
    main: "您的笔记为空",
    sub: "在阅读器界面，选中文字后，在弹出的对话框中添加笔记",
  },
  {
    mode: "digest",
    main: "您的书摘为空",
    sub: "在阅读器界面，选中文字后，在弹出的对话框中点击收藏",
  },
  {
    mode: "shelf",
    main: "您的书架为空",
    sub: "将鼠标移动到任意书本上方，在弹出的菜单中点击加号添加到书架",
  },
];
export const welcomeMessage = [
  {
    main: "这是一个免费开源的Epub阅读器",
    sub: "Koodo Reader同时支持桌面版和网页版，您所有的数据都可以导出和恢复",
  },
  {
    main: "只为最好的阅读体验",
    sub: "主题切换，阅读历史，图书管理，书架管理，更多功能等你探索",
  },
  {
    main: "简单流畅的操作方式",
    sub: "鼠标移至边缘弹出菜单，使用鼠标滚轮和键盘上下左右按键控制翻页",
  },
  {
    main: "快去添加您的第一本书吧",
    sub: "介绍完毕，点击左下角的按钮了解更多",
  },
];
export default readerConfig;
