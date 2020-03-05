// import recordLocation from "./recordLocation";
import StyleConfig from "./styleConfig";
// import ReaderConfig from "./readerConfig";

export const MouseEvent = (epub, key) => {
  let isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
  let lock = false; // 暂时锁住翻页快捷键，避免快速点击产生的Bug

  let arrowKeys = event => {
    event.preventDefault();

    if (lock) return;
    console.log("hello");
    if (event.keyCode === 37 || event.keyCode === 38) {
      epub.prevPage();
      lock = true;
      setTimeout(function() {
        lock = false;
      }, 100);
      return false;
    }

    if (event.keyCode === 39 || event.keyCode === 40) {
      epub.nextPage();
      lock = true;
      setTimeout(function() {
        lock = false;
      }, 100);
      return false;
    }
  };

  let mouseFirefox = event => {
    event.preventDefault();

    if (lock) return;

    if (event.detail < 0) {
      epub.prevPage();
      lock = true;
      setTimeout(function() {
        lock = false;
      }, 100);
      return false;
    }

    if (event.detail > 0) {
      epub.nextPage();
      lock = true;
      setTimeout(function() {
        lock = false;
      }, 100);
      return false;
    }
  };

  let mouseChrome = event => {
    // event.preventDefault();
    console.log("wheel moving");
    if (lock) return;

    if (event.wheelDelta > 0) {
      epub.prevPage();
      lock = true;
      setTimeout(function() {
        lock = false;
      }, 100);
      return false;
    }

    if (event.wheelDelta < 0) {
      epub.nextPage();
      lock = true;
      setTimeout(function() {
        lock = false;
      }, 100);
      return false;
    }
  };
  // let recordCfi = () => {
  //   let cfi = epub.getCurrentLocationCfi();
  //   let locations = epub.locations;
  //   let percentage = locations.percentageFromCfi(cfi);
  //   // console.log(percentage, "sahafhfh");
  //   console.log(percentage, "dgafhdafha");
  //   AutoBookmark.recordCfi(key, cfi, percentage);
  // };
  let copyText = event => {
    let key = event.keyCode || event.which;
    if (key === 67 && event.ctrlKey) {
      let iDoc = document.getElementsByTagName("iframe")[0].contentDocument;
      let text = iDoc.execCommand("copy", false, null);
      !text
        ? console.log("failed to copy text to clipboard")
        : console.log(`copied!`);
    }
  };

  epub.on("renderer:chapterDisplayed", () => {
    // console.log(
    //   "%c renderer:chapterDisplayed has been triggered! ",
    //   "color: cyan; background: #333333"
    // );

    let doc = epub.renderer.doc;

    // doc.addEventListener("click", openMenu); // 为每一章节内容绑定弹出菜单触发程序
    doc.addEventListener("keydown", arrowKeys, false); // 箭头按键翻页
    doc.addEventListener("keydown", copyText); // 解决 Ctrl + C 复制的bug
    window.addEventListener("keypress", () => {
      console.log("ehllo");
    }); // 解决 Ctrl + C 复制的bug

    // 鼠标滚轮翻页
    // console.log("wheel moving");
    if (isFirefox) doc.addEventListener("DOMMouseScroll", mouseFirefox, false);
    else {
      doc.addEventListener("mousewheel", mouseChrome, false);
      // doc.addEventListener("mousewheel", recordCfi, false);
    }
    // let viewArea = document.querySelector(".view-area-page");
    // viewArea.setAttribute(
    //   "style",
    //   `left: ${ReaderConfig.get().padding}px; right:${
    //     ReaderConfig.get().padding
    //   }px; top:${ReaderConfig.get().padding}px; bottom:${
    //     ReaderConfig.get().padding
    //   }px`
    // );
    StyleConfig.addDefaultCss(); // 切换章节后为当前文档设置默认的样式
    // console.log("我被执行能力");
    StyleConfig.applyCss(); // 切换章节后应当为当前文档设置样式
  });
};
