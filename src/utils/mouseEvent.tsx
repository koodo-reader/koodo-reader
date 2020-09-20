import OtherUtil from "./otherUtil";
import ReaderConfig from "./readerConfig";
let Hammer = (window as any).Hammer;

export const MouseEvent = (rendition: any) => {
  let isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
  let lock = false; // 暂时锁住翻页快捷键，避免快速点击产生的Bug
  const arrowKeys = (event: any) => {
    // event.preventDefault();
    if (lock) return;
    if (event.keyCode === 37 || event.keyCode === 38) {
      rendition.prev();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
    if (event.keyCode === 39 || event.keyCode === 40) {
      rendition.next();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
  };
  const mouseFirefox = (event: any) => {
    event.preventDefault();
    if (lock) return;
    if (event.detail < 0) {
      rendition.prev();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
    if (event.detail > 0) {
      rendition.next();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
  };

  const mouseChrome = (event: any) => {
    if (lock) return;
    if (event.wheelDelta > 0) {
      rendition.prev();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
    if (event.wheelDelta < 0) {
      rendition.next();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
  };

  const gesture = (event: any) => {
    if (lock) return;
    if (event.type === "panleft" || event.type === "panup") {
      rendition.next();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
    if (event.type === "panright" || event.type === "pandown") {
      rendition.prev();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    }
  };
  const bindEvent = (doc: any) => {
    doc.addEventListener("keydown", arrowKeys); // 箭头按键翻页
    // 鼠标滚轮翻页
    if (isFirefox) {
      doc.addEventListener("DOMMouseScroll", mouseFirefox, false);
    } else {
      doc.addEventListener("mousewheel", mouseChrome, false);
    }
  };
  const handleCursor = () => {
    if (lock) return;
    OtherUtil.setReaderConfig("isHideCursor", "yes");
    ReaderConfig.addDefaultCss();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 500);
    return false;
  };

  rendition.on("rendered", () => {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) {
      return;
    }
    if (OtherUtil.getReaderConfig("isTouch") === "yes") {
      const mc = new Hammer(doc);
      mc.on("panleft panright panup pandown", (event: any) => {
        gesture(event);
      });
    }
    doc.addEventListener("mousemove", handleCursor);

    // 鼠标滚轮翻页
    window.addEventListener("keydown", arrowKeys);
    bindEvent(doc);
  });
};
