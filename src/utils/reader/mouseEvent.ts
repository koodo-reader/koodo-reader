import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { getIframeDoc, getIframeWin } from "./docUtil";
import { handleExitFullScreen, handleFullScreen, sleep } from "../common";
import Hammer from "hammerjs";
import TTSUtil from "./ttsUtil";
import {
  getShortcutConfig,
  isNextPageKey,
  isPrevPageKey,
  matchShortcut,
  ShortcutAction,
} from "./shortcutUtil";
declare var window: any;

let throttleTime =
  (ConfigService.getReaderConfig("animation") || "none") !== "none"
    ? 1000
    : 100;

export const getSelection = (format: string, bookKey?: string) => {
  let docs = getIframeDoc(format, bookKey);
  let text = "";
  for (let i = 0; i < docs.length; i++) {
    let doc = docs[i];
    if (!doc) continue;
    let sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0) continue;
    // In Electron/Chromium, Selection.toString() includes text inside
    // user-select:none elements (e.g. <rt>/<rp> ruby annotations), even though
    // they are not visually highlighted. Clone the selected ranges into a
    // fragment, strip the ruby annotations, and read back the text so it
    // matches the visual selection (consistent with the CSS rule on <rt>).
    let fragment = doc.createDocumentFragment();
    for (let r = 0; r < sel.rangeCount; r++) {
      fragment.appendChild(sel.getRangeAt(r).cloneContents());
    }
    fragment.querySelectorAll("rt, rp").forEach((el) => el.remove());
    text = (fragment.textContent || "").trim();
    if (text) {
      break;
    }
  }

  return text;
};

export const getSelectionSentence = (
  format: string,
  bookKey?: string
): string => {
  let docs = getIframeDoc(format, bookKey);
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

const clickEvent = () =>
  new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });

export const searchInTheBook = (
  keyword: string,
  format: string,
  isSearch: boolean
) => {
  let leftPanel = document.querySelector(".left-panel");
  if (!leftPanel) return;
  leftPanel.dispatchEvent(clickEvent());
  const focusEvent = new MouseEvent("focus", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  let searchBox: any = document.querySelector(".header-search-box");
  searchBox.dispatchEvent(focusEvent);
  let searchIcon = document.querySelector(".header-search-icon");
  searchIcon?.dispatchEvent(clickEvent());
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

export const triggerPopupOptionClick = (optionName: string) => {
  const option = document.querySelector(`.${optionName}-option`);
  if (!option) return;
  option.dispatchEvent(clickEvent());
};

const SELECTION_SHORTCUT_OPTIONS: Array<{
  shortcut: ShortcutAction;
  optionName: string;
}> = [
  { shortcut: "selectionTranslate", optionName: "translation" },
  { shortcut: "selectionDict", optionName: "dict" },
  { shortcut: "selectionNote", optionName: "note" },
  { shortcut: "selectionHighlight", optionName: "highlight" },
  { shortcut: "selectionSpeak", optionName: "speaker" },
  { shortcut: "selectionSearch", optionName: "search-book" },
];

export const READING_PANEL_TOGGLE_EVENT = "koodo-reading-panel-toggle";

export const openReadingPanel = (
  position: "left" | "right" | "top" | "bottom"
) => {
  const panel = document.querySelector(`.${position}-panel`);
  if (!panel) return;
  panel.dispatchEvent(clickEvent());
};

export const toggleReadingPanel = (
  position: "left" | "right" | "top" | "bottom"
) => {
  window.dispatchEvent(
    new CustomEvent(READING_PANEL_TOGGLE_EVENT, {
      detail: { position },
    })
  );
};

export const openTableOfContents = () => {
  openReadingPanel("left");
};

const READING_PANEL_SHORTCUTS: Array<{
  shortcut: ShortcutAction;
  position: "left" | "right" | "top" | "bottom";
}> = [
  { shortcut: "openLeftPanel", position: "left" },
  { shortcut: "openRightPanel", position: "right" },
  { shortcut: "openTopPanel", position: "top" },
  { shortcut: "openBottomPanel", position: "bottom" },
];

export const NAV_TAB_TOGGLE_EVENT = "koodo-nav-tab-toggle";
export const toggleNavTab = (tab: string) => {
  window.dispatchEvent(
    new CustomEvent(NAV_TAB_TOGGLE_EVENT, {
      detail: { tab },
    })
  );
};

const NAV_TAB_SHORTCUTS: Array<{
  shortcut: ShortcutAction;
  tab: string;
}> = [
  { shortcut: "openBookmarkList", tab: "bookmarks" },
  { shortcut: "openNoteList", tab: "notes" },
  { shortcut: "openHighlightList", tab: "highlights" },
  { shortcut: "openToc", tab: "contents" },
];
let lock = false; //prevent from clicking too fasts
const arrowKeys = async (
  rendition: any,
  event: any,
  readerMode: string,
  format: string,
  bookKey: string
) => {
  if (
    event.target.tagName.toLowerCase() === "textarea" ||
    event.target.tagName.toLowerCase() === "input"
  ) {
    return;
  }
  if (isPrevPageKey(event, readerMode)) {
    event.preventDefault();
    await rendition.prev();
  } else if (isNextPageKey(event, readerMode)) {
    event.preventDefault();
    await rendition.next();
  }
  handleShortcut(event, format, bookKey, rendition);
};

const mouseChrome = async (rendition: any, deltaY: number) => {
  if (deltaY < 0) {
    await rendition.prev();
  }
  if (deltaY > 0) {
    await rendition.next();
  }
};

const handleShortcut = (
  event: any,
  format: string,
  bookKey: string,
  rendition?: any
) => {
  const shortcuts = getShortcutConfig();
  if (matchShortcut(event, shortcuts.bossKey)) {
    if (isElectron) {
      event.preventDefault();
      window.require("electron").ipcRenderer.invoke("hide-reader", "ping");
    }
  }
  if (matchShortcut(event, shortcuts.exitReader)) {
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
  if (matchShortcut(event, shortcuts.toggleFullscreen)) {
    event.preventDefault();
    const entering = ConfigService.getReaderConfig("isFullscreen") !== "yes";
    entering ? handleFullScreen() : handleExitFullScreen();
    ConfigService.setReaderConfig("isFullscreen", entering ? "yes" : "no");
  }
  if (matchShortcut(event, shortcuts.toggleFishMode)) {
    if (isElectron && ConfigService.getReaderConfig("isMergeWord")) {
      event.preventDefault();
      ConfigService.setReaderConfig(
        "isMergeWord",
        ConfigService.getReaderConfig("isMergeWord") === "yes" ? "no" : "yes"
      );
      window.require("electron").ipcRenderer.invoke("switch-moyu", "ping");
    }
  }
  if (matchShortcut(event, shortcuts.searchInBook)) {
    event.preventDefault();
    searchInTheBook("", "", false);
  }
  for (const { shortcut, position } of READING_PANEL_SHORTCUTS) {
    if (matchShortcut(event, shortcuts[shortcut])) {
      event.preventDefault();
      toggleReadingPanel(position);
      break;
    }
  }
  for (const { shortcut, tab } of NAV_TAB_SHORTCUTS) {
    if (matchShortcut(event, shortcuts[shortcut])) {
      event.preventDefault();
      toggleNavTab(tab);
      break;
    }
  }
  if (matchShortcut(event, shortcuts.createBookmark)) {
    event.preventDefault();
    const bookmarkBtn = document.querySelector(".add-bookmark-button");
    bookmarkBtn?.dispatchEvent(clickEvent());
  }
  if (rendition && matchShortcut(event, shortcuts.prevChapter)) {
    event.preventDefault();
    rendition.prevChapter();
  }
  if (rendition && matchShortcut(event, shortcuts.nextChapter)) {
    event.preventDefault();
    rendition.nextChapter();
  }
  for (const { shortcut, optionName } of SELECTION_SHORTCUT_OPTIONS) {
    if (matchShortcut(event, shortcuts[shortcut])) {
      if (getSelection(format, bookKey)) {
        event.preventDefault();
        triggerPopupOptionClick(optionName);
      }
      break;
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
let lastScaleTime = 0;
export const bindHtmlEvent = (
  rendition: any,
  doc: any,
  key: string = "",
  readerMode: string = "",
  format: string = "",
  handleScale: (scale: string) => void,
  renderBookFunc: () => void
) => {
  doc.addEventListener(
    "keydown",
    async (event) => {
      if (lock) return;
      lock = true;
      await arrowKeys(rendition, event, readerMode, format, key);
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
      await arrowKeys(rendition, event, readerMode, format, key);
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
    let docs = getIframeDoc(format, key);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      bindHtmlEvent(
        rendition,
        doc,
        key,
        readerMode,
        format,
        handleScale,
        renderBookFunc
      );
    }
    lock = false;
  });
};
