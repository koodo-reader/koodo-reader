import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import Book from "../../models/Book";
import { getIframeDoc, getIframeWin } from "./docUtil";
import {
  handleExitFullScreen,
  handleFullScreen,
  isReadingAidMode,
  sleep,
} from "../common";
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

// 每次翻页时实时读取，避免修改动画设置后锁延迟不生效
const getThrottleTime = () =>
  (ConfigService.getReaderConfig("animation") || "none") !== "none"
    ? 1000
    : 100;

export const getSelection = (book: Book) => {
  let docs = getIframeDoc(book);
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

export const getSelectionSentence = (book: Book): string => {
  let docs = getIframeDoc(book);
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
      // Avoid lookbehind (?<=) which is unsupported on low-version iOS Safari
      const rawParts = fullText.split(/([.!?。！？])\s*/);
      const sentences: string[] = [];
      for (let i = 0; i < rawParts.length; i += 2) {
        sentences.push(rawParts[i] + (rawParts[i + 1] ?? ""));
      }
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
  book: Book,
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
    searchBox.value = getSelection(book) || keyword;
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

// 仿真翻页动画收敛后（kookit 派发 flipend 事件）立即解除锁，
// 不再等待满 1000ms 的 throttleTime，滚轮/键盘可继续快速翻页
window.addEventListener("page-flipend", () => {
  lock = false;
});

const isRevertDirectionReading = (rendition: any) => {
  return (
    rendition?.revertDirection === "yes" &&
    !(rendition?.isVertical && rendition.isVertical())
  );
};

const arrowKeys = async (
  rendition: any,
  event: any,
  readerMode: string,
  book: Book
) => {
  if (
    event.target.tagName.toLowerCase() === "textarea" ||
    event.target.tagName.toLowerCase() === "input"
  ) {
    return;
  }
  const isReadingAid = isReadingAidMode(book.format, book.key);
  const revertDirection =
    isRevertDirectionReading(rendition) &&
    (readerMode !== "scroll" || isReadingAid);
  if (revertDirection && (event.keyCode === 37 || event.keyCode === 39)) {
    // RTL 下左右方向键整体镜像：← 下一页，→ 上一页
    event.preventDefault();
    if (event.keyCode === 37) {
      await rendition.next();
    } else {
      await rendition.prev();
    }
    handleShortcut(event, book, rendition);
    return;
  }
  if (readerMode === "scroll" && isReadingAid) {
    // 段落模式下拦截滚动模式的原生滚动按键，改为逐段导航
    const shortcutConfig = getShortcutConfig();
    if (matchShortcut(event, shortcutConfig.prevPage)) {
      event.preventDefault();
      await rendition.prev();
      handleShortcut(event, book, rendition);
      return;
    }
    if (matchShortcut(event, shortcutConfig.nextPage)) {
      event.preventDefault();
      await rendition.next();
      handleShortcut(event, book, rendition);
      return;
    }
  }
  if (isPrevPageKey(event, readerMode)) {
    event.preventDefault();
    await rendition.prev();
  } else if (isNextPageKey(event, readerMode)) {
    event.preventDefault();
    await rendition.next();
  }
  handleShortcut(event, book, rendition);
};

const mouseChrome = async (
  rendition: any,
  delta: number,
  revertDirection: boolean = false
) => {
  // RTL 下滚轮/触控板方向整体镜像：向上/向左为下一页
  const goNext = revertDirection ? delta < 0 : delta > 0;
  const goPrev = revertDirection ? delta > 0 : delta < 0;
  if (goPrev) {
    await rendition.prev();
  }
  if (goNext) {
    await rendition.next();
  }
};

const handleShortcut = (event: any, book: Book, rendition?: any) => {
  const shortcuts = getShortcutConfig();
  if (matchShortcut(event, shortcuts.bossKey)) {
    if (isElectron) {
      event.preventDefault();
      window.electronAPI.invoke("hide-reader", "ping");
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
          window.electronAPI.invoke("exit-tab", "ping");
        } else {
          window.electronAPI.invoke("exit-reader", "ping");
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
      window.electronAPI.invoke("switch-moyu", "ping");
    }
  }
  if (matchShortcut(event, shortcuts.searchInBook)) {
    event.preventDefault();
    searchInTheBook("", book, false);
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
      if (getSelection(book)) {
        event.preventDefault();
        triggerPopupOptionClick(optionName);
      }
      break;
    }
  }
};

const gesture = async (rendition: any, type: string) => {
  const revertDirection = isRevertDirectionReading(rendition);
  if (type === "panup") {
    await rendition.next();
  } else if (type === "pandown") {
    await rendition.prev();
  } else if (type === "panleft") {
    // RTL 下水平手势整体镜像：左滑上一页，右滑下一页
    await (revertDirection ? rendition.prev() : rendition.next());
  } else if (type === "panright") {
    await (revertDirection ? rendition.next() : rendition.prev());
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
// kookit 渲染章节时复用同一个 iframe document，"rendered" 每触发一次就会
// 走到这里重绑一遍，用 WeakSet 保证同一 doc 只绑定一次
const boundDocs = new WeakSet<Document>();
export const bindHtmlEvent = (
  rendition: any,
  doc: any,
  book: Book,
  readerMode: string = "",
  handleScale: (scale: string) => void,
  renderBookFunc: () => void
) => {
  if (boundDocs.has(doc)) return;
  boundDocs.add(doc);
  const key = book.key;
  const format = book.format;
  doc.addEventListener(
    "keydown",
    async (event) => {
      if (lock) return;
      lock = true;
      await arrowKeys(rendition, event, readerMode, book);
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), getThrottleTime());
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
      // 阅读尺等辅助模式下滚轮完全接管为逐段导航，preventDefault 必须在
      // lock 检查之前执行：锁定期内到达的连续滚轮事件若不拦截默认行为，
      // 会触发原生滚动与遮罩过渡动画叠加，造成动画掉帧（键盘事件无默认
      // 滚动行为，所以键盘快捷键不存在此问题）
      if (
        readerMode === "scroll" &&
        Math.abs(event.deltaX) === 0 &&
        isReadingAidMode(format, key)
      ) {
        event.preventDefault();
      }
      if (lock) return;
      lock = true;
      if (readerMode === "scroll") {
        if (Math.abs(event.deltaX) === 0 && isReadingAidMode(format, key)) {
          // 段落/阅读尺/速读模式内部实际按单页渲染，同样遵循 RTL
          await mouseChrome(
            rendition,
            event.deltaY,
            isRevertDirectionReading(rendition)
          );
        } else {
          await sleep(200);
          await rendition.record();
          if (
            Math.abs(event.deltaX) === 0 &&
            ConfigService.getReaderConfig("isDisableAutoScroll") !== "yes"
          ) {
            let srollElement = document.getElementById("page-area");
            await scrollChapter(srollElement, rendition, event.deltaY);
          }
        }
      } else {
        const revertDirection = isRevertDirectionReading(rendition);
        if (Math.abs(event.deltaX) === 0) {
          await mouseChrome(rendition, event.deltaY, revertDirection);
        } else if (
          revertDirection &&
          Math.abs(event.deltaY) < Math.abs(event.deltaX)
        ) {
          // RTL 下触控板水平滚动：向左滚动（deltaX<0）为下一页
          await mouseChrome(rendition, event.deltaX, true);
        }
      }
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), getThrottleTime());
    },
    { passive: false }
  );

  window.addEventListener(
    "keydown",
    async (event) => {
      if (lock) return;
      lock = true;
      await arrowKeys(rendition, event, readerMode, book);
      handleLocation(key, rendition);
      setTimeout(() => (lock = false), getThrottleTime());
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
      setTimeout(() => (lock = false), getThrottleTime());
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
      setTimeout(() => (lock = false), getThrottleTime());
    },
    { passive: false }
  );
};
export const htmlMouseEvent = (
  rendition: any,
  book: Book,
  readerMode: string,
  handleScale: (scale: string) => void,
  renderBookFunc: () => void
) => {
  rendition.on("rendered", () => {
    let iframe = getIframeWin();
    if (!iframe) return;
    iframe?.focus();
    let docs = getIframeDoc(book);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      bindHtmlEvent(
        rendition,
        doc,
        book,
        readerMode,
        handleScale,
        renderBookFunc
      );
    }
    lock = false;
  });
};
