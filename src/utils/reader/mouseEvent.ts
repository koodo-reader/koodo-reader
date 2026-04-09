import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { getIframeDoc, getIframeWin } from "./docUtil";
import { handleExitFullScreen, handleFullScreen, sleep } from "../common";
import Hammer from "hammerjs";
import TTSUtil from "./ttsUtil";
declare var window: any;

let throttleTime =
  ConfigService.getReaderConfig("isSliding") === "yes" ? 1000 : 100;

export const getSelection = (format: string) => {
  let docs = getIframeDoc(format);
  let text = "";
  for (let i = 0; i < docs.length; i++) {
    let doc = docs[i];
    if (!doc) continue;
    let sel = doc.getSelection();
    if (!sel) continue;
    text = sel.toString();
    text = text && text.trim();
    if (text) {
      break;
    }
  }

  return text;
};

export const getSelectionSentence = (format: string): string => {
  let docs = getIframeDoc(format);
  for (let i = 0; i < docs.length; i++) {
    let doc = docs[i];
    if (!doc) continue;
    let sel = doc.getSelection();
    if (!sel || !sel.toString().trim()) continue;
    try {
      let range = sel.getRangeAt(0);
      let container = range.commonAncestorContainer;
      // Walk up to a text-containing element
      let el: Node | null =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : container;
      let fullText = (el as Element)?.textContent || "";
      let selectedText = sel.toString().trim();
      // Split on sentence-ending punctuation to find the sentence
      let sentences = fullText.split(/(?<=[.!?。！？])\s*/);
      for (let s of sentences) {
        if (s.includes(selectedText)) {
          return s.trim();
        }
      }
      // Fallback: return the whole text content of the container
      return fullText.trim();
    } catch {
      // ignore
    }
  }
  return "";
};
export const searchInTheBook = (
  keyword: string,
  format: string,
  isSearch: boolean
) => {
  let leftPanel = document.querySelector(".left-panel");
  const clickEvent = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  if (!leftPanel) return;
  leftPanel.dispatchEvent(clickEvent);
  const focusEvent = new MouseEvent("focus", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  let searchBox: any = document.querySelector(".header-search-box");
  searchBox.dispatchEvent(focusEvent);
  let searchIcon = document.querySelector(".header-search-icon");
  searchIcon?.dispatchEvent(clickEvent);
  if (isSearch) {
    searchBox.value = getSelection(format) || keyword;
  }
  const keyEvent: any = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
  } as any);
  searchBox.dispatchEvent(keyEvent);
};
export const openTableOfContents = () => {
  let leftPanel = document.querySelector(".left-panel");
  const clickEvent = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  if (!leftPanel) return;
  leftPanel.dispatchEvent(clickEvent);
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
    if (ConfigService.getReaderConfig("isFullscreen") === "yes") {
      ConfigService.setReaderConfig("isFullscreen", "no");
      handleExitFullScreen();
    } else {
      ConfigService.setReaderConfig("isFullscreen", "no");
      window.speechSynthesis && window.speechSynthesis.cancel();
      TTSUtil.pauseAudio();
      if (isElectron) {
        if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
          window.require("electron").ipcRenderer.invoke("exit-tab", "ping");
        } else {
          window.close();
        }
      } else {
        ConfigService.setReaderConfig("isFinishWebReading", "yes");
        window.close();
      }
    }
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
    if (isElectron && ConfigService.getReaderConfig("isMergeWord")) {
      event.preventDefault();
      ConfigService.setReaderConfig(
        "isMergeWord",
        ConfigService.getReaderConfig("isMergeWord") === "yes" ? "no" : "yes"
      );
      window.require("electron").ipcRenderer.invoke("switch-moyu", "ping");
    }
  }
  if (event.keyCode === 70 && event.ctrlKey) {
    event.preventDefault();
    searchInTheBook("", "", false);
  }
  if (event.keyCode === 66 && event.ctrlKey) {
    event.preventDefault();
    openTableOfContents();
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
let lastScaleTime = 0;
export const bindHtmlEvent = (
  rendition: any,
  doc: any,
  key: string = "",
  readerMode: string = "",
  handleScale: (scale: string) => void,
  renderBookFunc: () => void
) => {
  doc.addEventListener(
    "keydown",
    async (event) => {
      if (lock) return;
      lock = true;
      await arrowKeys(rendition, event.keyCode, event, readerMode);
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), throttleTime);
    },
    { passive: false }
  );

  doc.addEventListener(
    "wheel",
    async (event) => {
      if (event.ctrlKey && readerMode !== "double") {
        const currentTime = Date.now();
        if (currentTime - lastScaleTime < 1500) {
          return;
        }
        lastScaleTime = currentTime;
        event.preventDefault();
        let scale = parseFloat(ConfigService.getReaderConfig("scale") || "1");
        if (event.deltaY < 0) {
          ConfigService.setReaderConfig("scale", scale + 0.1 + "");
        } else {
          ConfigService.setReaderConfig("scale", scale - 0.1 + "");
        }
        handleScale(ConfigService.getReaderConfig("scale") || "1");
        renderBookFunc();
        return;
      }
      if (lock) return;
      lock = true;
      if (readerMode === "scroll") {
        await sleep(200);
        await rendition.record();
        if (
          Math.abs(event.deltaX) === 0 &&
          ConfigService.getReaderConfig("isDisableAutoScroll") !== "yes"
        ) {
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
    { passive: false }
  );

  window.addEventListener(
    "keydown",
    async (event) => {
      if (lock) return;
      lock = true;
      await arrowKeys(rendition, event.keyCode, event, readerMode);
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), throttleTime);
    },
    { passive: false }
  );

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

  doc.addEventListener(
    "touchend",
    async () => {
      if (lock) return;
      lock = true;
      if (readerMode === "scroll") {
        await sleep(200);
        await rendition.record();
      }
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), throttleTime);
    },
    { passive: false }
  );
};
export const htmlMouseEvent = (
  rendition: any,
  key: string,
  readerMode: string,
  format: string,
  handleScale: (scale: string) => void,
  renderBookFunc: () => void
) => {
  rendition.on("rendered", () => {
    let iframe = getIframeWin();
    if (!iframe) return;
    iframe?.focus();
    let docs = getIframeDoc(format);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      bindHtmlEvent(
        rendition,
        doc,
        key,
        readerMode,
        handleScale,
        renderBookFunc
      );
    }
    lock = false;
  });
};
