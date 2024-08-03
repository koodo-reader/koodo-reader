import StorageUtil from "./storageUtil";
import RecordLocation from "../readUtils/recordLocation";
import { isElectron } from "react-device-detect";
import { getIframeDoc, getIframeWin } from "./docUtil";
import { handleExitFullScreen, handleFullScreen } from "../commonUtil";
declare var window: any;
declare var document: any;
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let throttleTime =
  StorageUtil.getReaderConfig("isSliding") === "yes" ? 1000 : 400;
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
const arrowKeys = async (
  rendition: any,
  keyCode: number,
  event: any,
  readerMode: string
) => {
  if (keyCode === 9) {
    event.preventDefault();
    return;
  }
  if (
    event.target.tagName.toLowerCase() === "textarea" ||
    event.target.tagName.toLowerCase() === "input"
  ) {
    return;
  }
  if (readerMode === "scroll" && (keyCode === 38 || keyCode === 40)) {
  } else if (keyCode === 33 || keyCode === 37 || keyCode === 38) {
    event.preventDefault();
    await rendition.prev();
  } else if (
    keyCode === 32 ||
    keyCode === 34 ||
    keyCode === 39 ||
    keyCode === 40
  ) {
    event.preventDefault();
    await rendition.next();
  }
  handleShortcut(event);
};

const mouseChrome = async (rendition: any, deltaY: number) => {
  if (deltaY < 0) {
    await rendition.prev();
  }
  if (deltaY > 0) {
    await rendition.next();
  }
};

const handleShortcut = (event: any) => {
  if (event.keyCode === 9) {
    if (isElectron) {
      event.preventDefault();
      window.require("electron").ipcRenderer.invoke("hide-reader", "ping");
    }
  }
  if (event.keyCode === 27) {
    StorageUtil.setReaderConfig("isFullscreen", "no");
  }
  if (event.keyCode === 122) {
    if (isElectron) {
      event.preventDefault();
      StorageUtil.getReaderConfig("isFullscreen") !== "yes"
        ? handleFullScreen()
        : handleExitFullScreen();

      if (StorageUtil.getReaderConfig("isFullscreen") === "yes") {
        StorageUtil.setReaderConfig("isFullscreen", "no");
      } else {
        StorageUtil.setReaderConfig("isFullscreen", "yes");
      }
    }
  }
  if (event.keyCode === 123) {
    if (isElectron) {
      event.preventDefault();
      StorageUtil.setReaderConfig(
        "isMergeWord",
        StorageUtil.getReaderConfig("isMergeWord") === "yes" ? "no" : "yes"
      );
      window.require("electron").ipcRenderer.invoke("switch-moyu", "ping");
    }
  }
};

const gesture = async (rendition: any, type: string) => {
  if (type === "panleft" || type === "panup") {
    await rendition.next();
  }
  if (type === "panright" || type === "pandown") {
    await rendition.prev();
  }
};

const handleLocation = (key: string, rendition: any) => {
  let position = rendition.getPosition();
  RecordLocation.recordHtmlLocation(
    key,
    position.text,
    position.chapterTitle,
    position.chapterDocIndex,
    position.chapterHref,
    position.count,
    position.percentage,
    position.cfi,
    position.page
  );
};
export const bindHtmlEvent = (
  rendition: any,
  doc: any,
  key: string = "",
  readerMode: string = ""
) => {
  doc.addEventListener("keydown", async (event) => {
    if (lock) return;
    lock = true;
    await arrowKeys(rendition, event.keyCode, event, readerMode);
    handleLocation(key, rendition);
    setTimeout(() => (lock = false), throttleTime);
  });
  doc.addEventListener(
    "wheel",
    async (event) => {
      if (lock) return;
      lock = true;
      if (readerMode === "scroll") {
        await sleep(200);
        await rendition.record();
      } else {
        if (Math.abs(event.deltaX) === 0) {
          await mouseChrome(rendition, event.deltaY);
        }
      }
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), throttleTime);
    },
    false
  );

  window.addEventListener("keydown", async (event) => {
    if (lock) return;
    lock = true;
    await arrowKeys(rendition, event.keyCode, event, readerMode);
    handleLocation(key, rendition);
    setTimeout(() => (lock = false), throttleTime);
  });

  if (StorageUtil.getReaderConfig("isTouch") === "yes") {
    const mc = new window.Hammer(doc);
    mc.on("panleft panright panup pandown", async (event: any) => {
      if (lock || event.pointerType === "mouse") return;
      lock = true;
      await gesture(rendition, event.type);
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), throttleTime);
    });
  }
};
export const HtmlMouseEvent = (
  rendition: any,
  key: string,
  readerMode: string
) => {
  rendition.on("rendered", () => {
    let iframe = getIframeWin();
    if (!iframe) return;
    iframe?.focus();
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
    if (lock) return;
    lock = true;
    handleShortcut(event);
    setTimeout(() => (lock = false), throttleTime);
  });
};
