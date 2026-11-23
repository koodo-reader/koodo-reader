import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import Book from "../../models/Book";
import { getIframeDoc, getIframeWin } from "./docUtil";
import {
  handleExitFullScreen,
  handleFullScreen,
  isReadingAidMode,
  isUndockedPopupBoxOpen,
  sleep,
} from "../common";
import { useAppStore } from "../../store/useAppStore";
import Hammer from "hammerjs";
import TTSUtil from "./ttsUtil";
import {
  getShortcutConfig,
  isNextPageKey,
  isPrevPageKey,
  matchShortcut,
  ShortcutAction,
} from "./shortcutUtil";
import { OVERLAY_TURN_DURATION } from "./overlayTurn";
declare var window: any;

// 翻页滑动动画固定时长（毫秒），需与 kookit 的 PAGE_TURN_DURATION 保持一致
const PAGE_TURN_DURATION = 200;

// 每次翻页时实时读取，避免修改动画设置后锁延迟不生效
const getThrottleTime = () => {
  const animation = ConfigService.getReaderConfig("animation") || "none";
  if (animation === "none") return 100;
  // 覆盖动画由应用层单独驱动，锁需覆盖整段动画，多留 60ms 保证 busy 先释放
  if (animation === "overlay") return OVERLAY_TURN_DURATION + 60;
  return PAGE_TURN_DURATION;
};

let lock = false; // 防止手势在短期内连续触发多次翻页（触摸 pan 用）

// 仿真翻页动画收敛后（kookit 派发 flipend 事件）立即解除锁，
// 不再等待满 throttleTime，手势可继续快速翻页
window.addEventListener("page-flipend", () => {
  lock = false;
});

// —— 滚轮/触控板手势流跟踪 ——
// 触控板一次双指滑动（含系统惯性）会以 ~16ms 间隔持续派发一串 delta 逐帧
// 衰减的 wheel 事件，长惯性可持续 1 秒以上，固定时长的锁挡不住：锁一释放，
// 惯性尾段就会再次翻页。也不能只看静默：翻页渲染章节时主线程卡顿，
// 期间事件会暂停派发并在队列中合并，卡顿结束瞬间会出现「假静默 +
// 大幅度」的合并事件，容易被当成新手势。因此按手势流跟踪，
// 翻页后挂起，重新放行必须满足其一：
// 1. 事件流静默 WHEEL_QUIET_MS 且翻页已结束 —— 静默从翻页完成时重新
//    起算，卡顿期被合并的事件到达后继续顺延，惯性真正结束才重新武装；
// 2. 新一轮滑动的起步冲击 —— 幅度远大于衰减中的尾段、按正常节奏到达
//    （卡顿合并出的大间隔事件不会误判）、且距上次翻页足够久（一次
//    滑动自身的 delta 爬升阶段不会误触发）。
// 保证一次滑动（含惯性）只翻一页，同时快速连续滑动不被拖慢
const WHEEL_QUIET_MS = 120;
const WHEEL_SPIKE_GAP_MS = 50;
const WHEEL_SPIKE_MIN_DELAY = 250;
let wheelArmed = true;
let wheelQuietTimer: ReturnType<typeof setTimeout> | null = null;
let wheelRefDelta = 0; // 上一次翻页后惯性流的参考幅度（随惯性逐帧衰减）
let wheelLastEventTime = 0; // 上一个滚轮事件到达时刻
let wheelConsumeTime = 0; // 上一次消费（翻页）时刻
let wheelTurnInFlightCount = 0; // 消费出的翻页正在 await 中的数量

const deferWheelArm = () => {
  if (wheelQuietTimer) clearTimeout(wheelQuietTimer);
  wheelQuietTimer = setTimeout(() => {
    wheelQuietTimer = null;
    // 翻页进行中的静默不可信（渲染卡顿会暂停事件派发），
    // 由 endWheelTurn 在翻页结束后重新起算
    if (wheelTurnInFlightCount === 0) wheelArmed = true;
  }, WHEEL_QUIET_MS);
};

// 真正翻页前调用：消费掉本次翻页机会并挂起。调用方必须在翻页 await
// 结束时（含抛错路径）调用 endWheelTurn
const beginWheelTurn = (delta: number, now: number) => {
  wheelArmed = false;
  wheelRefDelta = Math.abs(delta);
  wheelConsumeTime = now;
  wheelTurnInFlightCount++;
  deferWheelArm();
};

// 翻页 await 结束时调用：静默从现在重新起算，卡顿期被合并的大 delta
// 事件将按惯性吸收
const endWheelTurn = () => {
  wheelTurnInFlightCount = Math.max(0, wheelTurnInFlightCount - 1);
  deferWheelArm();
};

// 判定本次滚轮事件是否允许翻页；允许则同时消费并挂起。
// 必须在翻页瞬间调用（而不是事件入口）：普通滚动事件不消费手势，
// 否则滚动模式中一次长滚动会在章节边缘被错误抑制
const acquireWheelArm = (delta: number, gap: number) => {
  const now = performance.now();
  if (wheelArmed) {
    beginWheelTurn(delta, now);
    return true;
  }
  const magnitude = Math.abs(delta);
  if (
    gap < WHEEL_SPIKE_GAP_MS &&
    now - wheelConsumeTime >= WHEEL_SPIKE_MIN_DELAY &&
    magnitude > wheelRefDelta * 2
  ) {
    // 新一轮滑动的起步冲击
    beginWheelTurn(delta, now);
    return true;
  }
  // 惯性仍在继续：衰减参考幅度（静默计时由事件入口统一顺延）
  wheelRefDelta = Math.max(magnitude, wheelRefDelta * 0.7);
  return false;
};

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

export const openReadingPanel = (position: "left" | "right") => {
  const panel = document.querySelector(`.${position}-panel`);
  if (!panel) return;
  panel.dispatchEvent(clickEvent());
};

export const toggleReadingPanel = (position: "left" | "right") => {
  window.dispatchEvent(
    new CustomEvent(READING_PANEL_TOGGLE_EVENT, {
      detail: { position },
    })
  );
};

const READING_PANEL_SHORTCUTS: Array<{
  shortcut: ShortcutAction;
  position: "left" | "right";
}> = [
  { shortcut: "openLeftPanel", position: "left" },
  { shortcut: "openRightPanel", position: "right" },
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
const isRevertDirectionReading = (rendition: any) => {
  // 竖排同样遵循「从右往左翻页」：按键/滚轮/手势方向一起镜像
  return rendition?.revertDirection === "yes";
};

// 翻页方向键分组：LTR 下 ↓ → PageDown 是「下一页」，RTL 下整体反过来
const LTR_NEXT_DIRECTION_KEYS = [40, 39, 34]; // ↓ → PageDown
const PAGE_DIRECTION_KEYS = [37, 38, 33, 40, 39, 34]; // ← ↑ PageUp ↓ → PageDown
const isHorizontalArrow = (keyCode: number) => keyCode === 37 || keyCode === 39;

// 弹窗未固定到右侧时，ESC 只关闭弹窗；返回 true 表示按键已处理，
// 调用方必须直接 return，避免继续走到 exitReader 而退出阅读
const handlePopupBoxEscape = (event: any, book: Book) => {
  if (event.keyCode !== 27) return false;
  const state = useAppStore.getState();
  if (!isUndockedPopupBoxOpen(state.viewArea, state.reader)) return false;
  event.preventDefault();
  state.handleOpenMenu(false);
  state.handleNoteKey("");
  state.handleMenuMode("");
  getIframeDoc(book).forEach((doc) => doc?.getSelection()?.empty());
  return true;
};

const arrowKeys = async (
  rendition: any,
  event: any,
  readerMode: string,
  book: Book
) => {
  // 必须放在 textarea/input 提前返回之前：焦点在笔记或 AI 输入框内时，
  // ESC 同样需要关闭弹窗，且不能继续触发 exitReader 退出阅读
  if (handlePopupBoxEscape(event, book)) return;
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
  const shortcutConfig = getShortcutConfig();
  // RTL 下翻页方向整体镜像：← ↑ PageUp 下一页，→ ↓ PageDown 上一页。
  // matchShortcut 为修饰键精确匹配，因此 Ctrl+Alt+←/→ 这类章节快捷键不会被误拦截
  if (
    revertDirection &&
    PAGE_DIRECTION_KEYS.includes(event.keyCode) &&
    (matchShortcut(event, shortcutConfig.nextPage) ||
      matchShortcut(event, shortcutConfig.prevPage))
  ) {
    event.preventDefault();
    if (LTR_NEXT_DIRECTION_KEYS.includes(event.keyCode)) {
      await rendition.prev();
    } else {
      await rendition.next();
    }
    handleShortcut(event, book, rendition);
    return;
  }
  if (readerMode === "scroll" && isReadingAid) {
    // 段落模式下拦截滚动模式的原生滚动按键，改为逐段导航
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
    const bookmarkBtn = document.querySelector(".reader-toolbar-bookmark");
    bookmarkBtn?.dispatchEvent(clickEvent());
  }
  const revertChapter = isRevertDirectionReading(rendition);
  // RTL 下 ← → 的空间含义整体反转，章节快捷键同步反转
  if (rendition && matchShortcut(event, shortcuts.prevChapter)) {
    event.preventDefault();
    if (isHorizontalArrow(event.keyCode) && revertChapter) {
      rendition.nextChapter();
    } else {
      rendition.prevChapter();
    }
  }
  if (rendition && matchShortcut(event, shortcuts.nextChapter)) {
    event.preventDefault();
    if (isHorizontalArrow(event.keyCode) && revertChapter) {
      rendition.prevChapter();
    } else {
      rendition.nextChapter();
    }
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
  deltaY: number,
  // 事件到达时与上一个事件的间隔，用于识别新一轮滑动的起步冲击；
  // 外部调用不传则禁用该判定，静默规则仍然生效
  gap: number = Infinity
) => {
  if (deltaY < 0) {
    if (element.scrollTop === 0) {
      // 到达章节边缘才判定并消费手势，惯性尾段不会连翻多章
      if (!acquireWheelArm(deltaY, gap)) return;
      try {
        await rendition.prev();
      } finally {
        endWheelTurn();
      }
    }
  }
  if (deltaY > 0) {
    var scrollHeight = element.scrollHeight;
    var scrollTop = element.scrollTop;
    var clientHeight = element.clientHeight;
    if (Math.abs(scrollTop + clientHeight - scrollHeight) < 10) {
      if (!acquireWheelArm(deltaY, gap)) return;
      try {
        await rendition.next();
      } finally {
        endWheelTurn();
      }
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
      await arrowKeys(rendition, event, readerMode, book);
      handleLocation(key, rendition);
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
      // 阅读尺等辅助模式下滚轮完全接管为逐段导航，先拦截原生滚动，
      // 避免与遮罩过渡动画叠加造成动画掉帧
      if (
        readerMode === "scroll" &&
        Math.abs(event.deltaX) === 0 &&
        isReadingAidMode(format, key)
      ) {
        event.preventDefault();
      }
      // 触控板一次滑动（含惯性）会派发一整串 wheel 事件：挂起期内任何
      // 滚轮事件（含噪声级）都代表惯性流仍在继续，统一顺延静默计时；
      // 噪声级滚动不翻页。preventDefault 必须在这之前执行（见上），
      // 挂起期内到达的滚轮事件仍要拦截原生滚动
      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const now = performance.now();
      const gap = now - wheelLastEventTime;
      wheelLastEventTime = now;
      if (!wheelArmed) deferWheelArm();
      if (Math.abs(dominantDelta) < 1) return;
      if (readerMode === "scroll") {
        if (Math.abs(event.deltaX) === 0 && isReadingAidMode(format, key)) {
          // 段落/阅读尺/速读模式内部实际按单页渲染，同样遵循 RTL
          if (!acquireWheelArm(event.deltaY, gap)) return;
          try {
            await mouseChrome(
              rendition,
              event.deltaY,
              isRevertDirectionReading(rendition)
            );
          } finally {
            endWheelTurn();
          }
        } else {
          await sleep(200);
          await rendition.record();
          if (
            Math.abs(event.deltaX) === 0 &&
            ConfigService.getReaderConfig("isDisableAutoScroll") !== "yes"
          ) {
            let srollElement = document.getElementById("page-area");
            await scrollChapter(srollElement, rendition, event.deltaY, gap);
          }
        }
      } else {
        if (!acquireWheelArm(dominantDelta, gap)) return;
        try {
          const revertDirection = isRevertDirectionReading(rendition);
          // 触控板双指滑动按主导方向翻页：垂直滑动（含轻微水平噪声）按
          // deltaY 翻页，水平分量占优时按 deltaX 翻页，RTL 下整体镜像
          if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            // 向左滚动（deltaX<0）在 RTL 下为下一页，LTR 下为上一页
            await mouseChrome(rendition, event.deltaX, revertDirection);
          } else {
            await mouseChrome(rendition, event.deltaY, revertDirection);
          }
        } finally {
          endWheelTurn();
        }
      }
      handleLocation(key, rendition);
    },
    { passive: false }
  );

  if (ConfigService.getReaderConfig("isTouch") === "yes") {
    const mc = new Hammer(doc);
    mc.on("panleft panright panup pandown", async (event: any) => {
      if (readerMode === "scroll") {
        return;
      }
      // 一次滑动过程中 Hammer 会连续派发多个 pan 事件，加锁保证一次手势只翻一页
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
      if (readerMode === "scroll") {
        await sleep(200);
        await rendition.record();
      }
      handleLocation(key, rendition);
    },
    { passive: false }
  );
};
// PDF/漫画等分页格式每个子 iframe 都会走到 bindHtmlEvent，若在逐个 doc 的
// 路径里注册 window keydown，一次按键会被多个监听器重复处理。这里改为每次
// 渲染时替换旧监听，保证每个阅读器只有一个监听器，且绑定最新的
// rendition/book/readerMode
let windowKeydownHandler: ((event: any) => Promise<void>) | null = null;
export const htmlMouseEvent = (
  rendition: any,
  book: Book,
  readerMode: string,
  handleScale: (scale: string) => void,
  renderBookFunc: () => void
) => {
  if (windowKeydownHandler) {
    window.removeEventListener("keydown", windowKeydownHandler);
  }
  const key = book.key;
  windowKeydownHandler = async (event) => {
    await arrowKeys(rendition, event, readerMode, book);
    handleLocation(key, rendition);
  };
  window.addEventListener("keydown", windowKeydownHandler, { passive: false });

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
    // 新章节渲染完成即代表上一次翻页已结束，清除残留的翻页锁
    lock = false;
  });
};
