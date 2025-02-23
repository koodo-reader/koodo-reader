import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { getIframeDoc, getIframeWin } from "./docUtil";
import { handleExitFullScreen, handleFullScreen, sleep } from "../common";
import Hammer from "hammerjs";
import BookUtil from "../file/bookUtil";
declare var window: any;

let throttleTime =
  ConfigService.getReaderConfig("isSliding") === "yes" ? 1000 : 400;

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
    ConfigService.setReaderConfig("isFullscreen", "no");
  }
  if (event.keyCode === 122) {
    if (isElectron) {
      event.preventDefault();
      ConfigService.getReaderConfig("isFullscreen") !== "yes"
        ? handleFullScreen()
        : handleExitFullScreen();

      if (ConfigService.getReaderConfig("isFullscreen") === "yes") {
        ConfigService.setReaderConfig("isFullscreen", "no");
      } else {
        ConfigService.setReaderConfig("isFullscreen", "yes");
      }
    }
  }
  if (event.keyCode === 123) {
    if (isElectron) {
      event.preventDefault();
      ConfigService.setReaderConfig(
        "isMergeWord",
        ConfigService.getReaderConfig("isMergeWord") === "yes" ? "no" : "yes"
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
  ConfigService.setObjectConfig(key, position, "recordLocation");
};
export const scrollChapter = async (
  element: any,
  rendition: any,
  deltaY: number
) => {
  if (deltaY < 0) {
    if (element.scrollTop === 0) {
      await rendition.prev();
    }
  }
  if (deltaY > 0) {
    var scrollHeight = element.scrollHeight;
    var scrollTop = element.scrollTop;
    var clientHeight = element.clientHeight;
    if (Math.abs(scrollTop + clientHeight - scrollHeight) < 10) {
      await rendition.next();
    }
  }
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
      if (event.ctrlKey && readerMode !== "double") {
        let scale = parseFloat(ConfigService.getReaderConfig("scale") || "1");
        if (event.deltaY < 0) {
          ConfigService.setReaderConfig("scale", scale + 0.1 + "");
        } else {
          ConfigService.setReaderConfig("scale", scale - 0.1 + "");
        }
        BookUtil.reloadBooks();
        return;
      }
      if (lock) return;
      lock = true;
      if (readerMode === "scroll") {
        await sleep(200);
        await rendition.record();
        if (Math.abs(event.deltaX) === 0) {
          let srollElement = document.getElementById("page-area");
          await scrollChapter(srollElement, rendition, event.deltaY);
        }
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

  if (ConfigService.getReaderConfig("isTouch") === "yes") {
    const mc = new Hammer(doc);
    mc.on("panleft panright panup pandown", async (event: any) => {
      if (readerMode === "scroll") {
        return;
      }
      if (lock || event.pointerType === "mouse") return;
      lock = true;
      await gesture(rendition, event.type);
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), throttleTime);
    });
  }

  doc.addEventListener("touchend", async () => {
    if (lock) return;
    lock = true;
    if (readerMode === "scroll") {
      await sleep(200);
      await rendition.record();
    }
    handleLocation(key, rendition);
    setTimeout(() => (lock = false), throttleTime);
  });
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
