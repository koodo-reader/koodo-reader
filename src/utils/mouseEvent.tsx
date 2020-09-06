export const MouseEvent = (rendition: any) => {
  let isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
  let lock = false; // 暂时锁住翻页快捷键，避免快速点击产生的Bug
  let arrowKeys = (event: any) => {
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
  let mouseFirefox = (event: any) => {
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

  let mouseChrome = (event: any) => {
    if (lock) return;
    if (event.wheelDelta > 0) {
      console.log(rendition, "rendition");
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
  let rebind = () => {
    console.log("rebind");
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) {
      return;
    }
    doc.addEventListener("keydown", arrowKeys); // 箭头按键翻页
    // 鼠标滚轮翻页
    if (isFirefox) {
      doc.addEventListener("DOMMouseScroll", mouseFirefox, false);
    } else {
      doc.addEventListener("mousewheel", mouseChrome, false);
    }
  };
  let bindEvent = (doc: any) => {
    doc.addEventListener("keydown", arrowKeys); // 箭头按键翻页
    // 鼠标滚轮翻页
    if (isFirefox) {
      doc.addEventListener("DOMMouseScroll", mouseFirefox, false);
    } else {
      doc.addEventListener("mousewheel", mouseChrome, false);
    }
  };
  rendition.on("locationChanged", () => {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) {
      return;
    }
    // 鼠标滚轮翻页
    window.addEventListener("keydown", arrowKeys);
    window.addEventListener("mousewheel", rebind);
    window.addEventListener("DOMMouseScroll", rebind);
    window.onmousewheel = rebind;
    bindEvent(doc);
  });
};
