import StorageUtil from "./storageUtil";
import RecordLocation from "../readUtils/recordLocation";
import { isElectron } from "react-device-detect";
import { getIframeDoc } from "./docUtil";
let Hammer = (window as any).Hammer;
declare var document: any;
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
let timeStamp = 0;
let timeCount = 0;

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

const mouseChrome = (rendition: any, deltaY: number) => {
  if (lock) return;
  if (deltaY < 0) {
    rendition.prev();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, throttleTime);
    return false;
  }
  if (deltaY > 0) {
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
  }
  if (keyCode === 27) {
    if (isElectron) {
      StorageUtil.setReaderConfig("isFullscreen", "no");
    }
  }
  if (keyCode === 122) {
    if (isElectron) {
      event.preventDefault();
      if (StorageUtil.getReaderConfig("isFullscreen") === "yes") {
        window
          .require("electron")
          .ipcRenderer.invoke("exit-fullscreen", "ping");
        StorageUtil.setReaderConfig("isFullscreen", "no");
      } else {
        window
          .require("electron")
          .ipcRenderer.invoke("enter-fullscreen", "ping");
        StorageUtil.setReaderConfig("isFullscreen", "yes");
      }
    }
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
  }
  lock = true;
  setTimeout(function () {
    lock = false;
  }, throttleTime);
  return false;
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

const handleLocation = async (key: string, rendition: any) => {
  let position = await rendition.getPosition();
  RecordLocation.recordHtmlLocation(
    key,
    position.text,
    position.chapterTitle,
    position.count,
    position.percentage,
    position.cfi
  );
};
export const bindHtmlEvent = (
  rendition: any,
  doc: any,
  key: string = "",
  readerMode: string = ""
) => {
  doc.addEventListener("keydown", async (event) => {
    arrowKeys(rendition, event.keyCode, event);
    await handleLocation(key, rendition);
  });
  //判断是否正在使用笔记本电脑的的触控板

  doc.addEventListener(
    "wheel",
    async (event) => {
      if (readerMode === "scroll") {
        await sleep(200);
        rendition.record();
      } else {
        timeCount++;
        if (new Date().getTime() - timeStamp > 100) {
          Math.abs(event.deltaX) === 0 && mouseChrome(rendition, event.deltaY);
          timeStamp = new Date().getTime();
          timeCount = 0;
        } else if (timeCount > 10 && new Date().getTime() - timeStamp > 0) {
          Math.abs(event.deltaX) === 0 && mouseChrome(rendition, event.deltaY);
          timeCount = 0;
          timeStamp = new Date().getTime() + 2000;
        }
      }

      await handleLocation(key, rendition);
    },
    false
  );

  window.addEventListener("keydown", async (event) => {
    arrowKeys(rendition, event.keyCode, event);
    //使用Key判断是否是htmlBook

    await handleLocation(key, rendition);
  });

  if (StorageUtil.getReaderConfig("isTouch") === "yes") {
    const mc = new Hammer(doc);
    mc.on("panleft panright panup pandown", async (event: any) => {
      gesture(rendition, event.type);

      await handleLocation(key, rendition);
    });
  }
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
