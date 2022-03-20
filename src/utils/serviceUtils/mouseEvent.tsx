import StorageUtil from "./storageUtil";
import RecordLocation from "../readUtils/recordLocation";
import { isElectron } from "react-device-detect";
import { getIframeDoc } from "./docUtil";
let Hammer = (window as any).Hammer;
declare var document: any;
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let throttleTime =
  StorageUtil.getReaderConfig("isSliding") === "yes" ? 1000 : 100;
export const getSelection = () => {
  let doc = getIframeDoc();
  if (!doc) return;
  let sel = doc.getSelection();
  if (!sel) return;
  let text = sel.toString();
  text = text && text.trim();
  return text || "";
};
let lock = false; //prevent from clicking too fasts
const arrowKeys = (rendition: any, keyCode: number, event: any) => {
  if (
    document.querySelector(".editor-box") ||
    document.querySelector(".navigation-search-title")
  ) {
    return;
  }

  if (lock) return;
  if (keyCode === 37 || keyCode === 38) {
    event.preventDefault();
    rendition.prev();

    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
    return false;
  }
  if (keyCode === 39 || keyCode === 40 || keyCode === 32) {
    event.preventDefault();
    rendition.next();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
    return false;
  }
  handleShortcut(event, keyCode);
};

const mouseChrome = (rendition: any, wheelDelta: number) => {
  if (lock) return;
  if (wheelDelta > 0) {
    rendition.prev();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
    return false;
  }
  if (wheelDelta < 0) {
    rendition.next();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
    return false;
  }
};

const handleShortcut = (event: any, keyCode: number) => {
  if (keyCode === 9) {
    if (isElectron) {
      event.preventDefault();
      window.require("electron").ipcRenderer.invoke("hide-reader", "ping");
    }
    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
    return false;
  }
  if (keyCode === 123) {
    if (isElectron) {
      event.preventDefault();
      StorageUtil.setReaderConfig(
        "isMergeWord",
        StorageUtil.getReaderConfig("isMergeWord") === "yes" ? "no" : "yes"
      );
      window.require("electron").ipcRenderer.invoke("switch-moyu", "ping");
    }
    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
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
    }, throttleTime);
    return false;
  }
  if (type === "panright" || type === "pandown") {
    rendition.prev();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
    return false;
  }
};

const bindEpubEvent = (rendition: any, doc: any) => {
  doc.addEventListener(
    "keydown",
    (event) => {
      arrowKeys(rendition, event.keyCode, event);
    },
    false
  );
  doc.addEventListener(
    "mousewheel",
    (event) => {
      mouseChrome(rendition, event.wheelDelta);
    },
    false
  );
  window.addEventListener(
    "keydown",
    (event) => {
      arrowKeys(rendition, event.keyCode, event);
      //使用Key判断是否是htmlBook
    },
    false
  );

  if (StorageUtil.getReaderConfig("isTouch") === "yes") {
    const mc = new Hammer(doc);
    mc.on("panleft panright panup pandown", (event: any) => {
      gesture(rendition, event.type);
    });
  }
};
const bindHtmlEvent = (
  rendition: any,
  doc: any,
  key: string = "",
  readerMode: string = ""
) => {
  doc.addEventListener("keydown", (event) => {
    arrowKeys(rendition, event.keyCode, event);

    let position = JSON.parse(rendition.getPosition());
    RecordLocation.recordHtmlLocation(
      key,
      position.text,
      position.chapterTitle,
      position.count,
      position.percentage
    );
  });
  doc.addEventListener(
    "mousewheel",
    async (event) => {
      if (readerMode === "scroll") {
        await sleep(200);
        rendition.record();
      } else {
        mouseChrome(rendition, event.wheelDelta);
      }

      let position = JSON.parse(rendition.getPosition());
      RecordLocation.recordHtmlLocation(
        key,
        position.text,
        position.chapterTitle,
        position.count,
        position.percentage
      );
    },
    false
  );

  window.addEventListener("keydown", (event) => {
    arrowKeys(rendition, event.keyCode, event);
    //使用Key判断是否是htmlBook

    let position = JSON.parse(rendition.getPosition());
    RecordLocation.recordHtmlLocation(
      key,
      position.text,
      position.chapterTitle,
      position.count,
      position.percentage
    );
  });

  if (StorageUtil.getReaderConfig("isTouch") === "yes") {
    const mc = new Hammer(doc);
    mc.on("panleft panright panup pandown", (event: any) => {
      gesture(rendition, event.type);

      let position = JSON.parse(rendition.getPosition());
      RecordLocation.recordHtmlLocation(
        key,
        position.text,
        position.chapterTitle,
        position.count,
        position.percentage
      );
    });
  }
};
export const EpubMouseEvent = (rendition: any, readerMode: string) => {
  rendition.on("rendered", () => {
    let doc = getIframeDoc();
    if (!doc) return;
    if (readerMode === "scroll") {
      doc.addEventListener("keydown", (event) => {
        arrowKeys(rendition, event.keyCode, event);
        //使用Key判断是否是htmlBook
      });
      return;
    }
    lock = false;
    bindEpubEvent(rendition, doc);
  });
};
export const HtmlMouseEvent = (
  rendition: any,
  key: string,
  readerMode: string
) => {
  rendition.on("rendered", () => {
    let doc = getIframeDoc();
    if (!doc) return;
    lock = false;
    bindHtmlEvent(rendition, doc, key, readerMode);
  });
};
export const pdfMouseEvent = () => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return;
  let doc: any = iframe.contentWindow || iframe.contentDocument?.defaultView;

  doc.document.addEventListener("keydown", (event) => {
    handleShortcut(event, event.keyCode);
  });
};
export const djvuMouseEvent = () => {
  document.addEventListener("keydown", (event) => {
    handleShortcut(event, event.keyCode);
  });
};
