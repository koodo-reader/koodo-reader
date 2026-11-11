import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import Book from "../../models/Book";
import { isReadingAidMode } from "../common";
import { getIframeDoc } from "./docUtil";

// 「覆盖」翻页动画：翻页前把整个窗口的画面截图铺在最上层，翻页后截图滑走，露出新页面
// 覆盖动画由应用层单独驱动，时长与 kookit 内置动画（PAGE_TURN_DURATION）不同
export const OVERLAY_TURN_DURATION = 320;
const OVERLAY_CAPTURE_DELAY = 260;
const OVERLAY_CLASS_NAME = "koodo-overlay-turn";
// Apple Books 式的 ease-out：起步果断、收尾柔和，但减速更平缓，
// 避免 ease-out-cubic 那种「前一半走完、后一半几乎不动」的拖尾感
const OVERLAY_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
// 收尾淡出只覆盖最后 50ms（此时截图已基本移出阅读区），用于抹掉移除浮层时的突变
const OVERLAY_FADE_DURATION = 50;
// 滑出页面在接缝处投下的软阴影，让纸张有分离感
const OVERLAY_SHADOW_SIZE = 26;
const OVERLAY_SHADOW_ALPHA = 0.22;

interface CaptureShot {
  image: HTMLImageElement;
  left: number;
  top: number;
  width: number;
  height: number;
  signature: string;
}

interface TurnMotion {
  vertical: boolean;
  positive: boolean;
}

interface OverlayTurnController {
  rendition: any;
  book: Book;
  readerMode: string;
  originalNext: (...args: any[]) => any;
  originalPrev: (...args: any[]) => any;
  wrappedNext: (...args: any[]) => any;
  wrappedPrev: (...args: any[]) => any;
  onRendered: () => void;
  cachedShot: CaptureShot | null;
  overlay: HTMLDivElement | null;
  captureTimer: number | null;
  removeTimer: number | null;
  busy: boolean;
  active: boolean;
}

let controller: OverlayTurnController | null = null;

const isOverlayTurnEnabled = () =>
  isElectron &&
  (ConfigService.getReaderConfig("animation") || "none") === "overlay";

const destroyOverlay = (ctrl: OverlayTurnController) => {
  if (ctrl.removeTimer !== null) {
    window.clearTimeout(ctrl.removeTimer);
    ctrl.removeTimer = null;
  }
  if (ctrl.overlay) {
    ctrl.overlay.remove();
    ctrl.overlay = null;
  }
};

const clearCaptureTimer = (ctrl: OverlayTurnController) => {
  if (ctrl.captureTimer !== null) {
    window.clearTimeout(ctrl.captureTimer);
    ctrl.captureTimer = null;
  }
};

const getViewportRect = () => {
  const width = Math.round(window.innerWidth);
  const height = Math.round(window.innerHeight);
  if (width < 1 || height < 1) return null;
  return { left: 0, top: 0, width, height };
};

const decodeCapture = (dataURL: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = document.createElement("img");
    image.decoding = "async";
    image.draggable = false;
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = dataURL;
  });

const captureWindowView = async (): Promise<CaptureShot | null> => {
  if (!isElectron || !window.electronAPI) return null;
  // 只有阅读区就绪后才截图
  if (!document.getElementById("page-area")) return null;
  if (document.querySelector(`.${OVERLAY_CLASS_NAME}`)) return null;
  // 截图范围是整个窗口（含背景、留白与书页边框），而不是 iframe 区域，
  // 否则滑出的只是一个矩形文本区，与周围背景脱节
  const rect = getViewportRect();
  if (!rect) return null;
  try {
    const dataURL = await window.electronAPI.invoke<string>(
      "capture-reader-page",
      rect
    );
    if (!dataURL) return null;
    // 提前解码，翻页时直接复用这个 <img>，避免浮层首帧空白造成闪烁
    const image = await decodeCapture(dataURL);
    if (!image) return null;
    return { ...rect, image, signature: "" };
  } catch {
    return null;
  }
};

const getTurnMotion = (
  ctrl: OverlayTurnController,
  direction: "next" | "prev"
): TurnMotion => {
  const vertical = !!ctrl.rendition.isVertical?.();
  const revert = !vertical && ctrl.rendition.revertDirection === "yes";
  const forward = direction === "next";
  return {
    vertical,
    positive: vertical ? !forward : revert ? forward : !forward,
  };
};

// 用位置 + 各文档滚动量判断这一次翻页是否真的换了页面
const getPageSignature = (ctrl: OverlayTurnController) => {
  const position = ctrl.rendition.getPosition?.() || {};
  const docs = getIframeDoc(ctrl.book);
  const pageArea = document.getElementById("page-area");
  const docScroll = docs.map((doc) => {
    const body = doc?.body;
    if (!body) return "";
    return `${Math.round(body.scrollLeft)},${Math.round(body.scrollTop)}`;
  });
  return [
    position.chapterDocIndex ?? "",
    position.chapterHref ?? "",
    position.percentage ?? "",
    pageArea
      ? `${Math.round(pageArea.scrollLeft)},${Math.round(pageArea.scrollTop)}`
      : "",
    ...docScroll,
  ].join("|");
};

const schedulePreCapture = (ctrl: OverlayTurnController) => {
  if (!ctrl.active || ctrl.readerMode === "scroll") return;
  if (!isOverlayTurnEnabled()) return;
  // 摸鱼模式窗口是透明的，截图会丢失背景
  if (ConfigService.getReaderConfig("isMergeWord") === "yes") return;
  clearCaptureTimer(ctrl);
  ctrl.captureTimer = window.setTimeout(async () => {
    ctrl.captureTimer = null;
    if (!ctrl.active || ctrl.busy) return;
    const signature = getPageSignature(ctrl);
    const shot = await captureWindowView();
    if (!ctrl.active || ctrl.busy || !shot) return;
    // 截图期间页面若已变化，这张图就作废，避免用到过期画面
    if (getPageSignature(ctrl) !== signature) return;
    shot.signature = signature;
    ctrl.cachedShot = shot;
  }, OVERLAY_CAPTURE_DELAY);
};

const createEdgeShadow = ({ vertical, positive }: TurnMotion) => {
  const shadow = document.createElement("div");
  shadow.style.position = "absolute";
  shadow.style.pointerEvents = "none";
  shadow.style.width = vertical ? "100%" : `${OVERLAY_SHADOW_SIZE}px`;
  shadow.style.height = vertical ? `${OVERLAY_SHADOW_SIZE}px` : "100%";
  const dark = `rgba(0, 0, 0, ${OVERLAY_SHADOW_ALPHA})`;
  const clear = "rgba(0, 0, 0, 0)";
  if (vertical) {
    shadow.style.left = "0";
    if (positive) {
      shadow.style.top = `-${OVERLAY_SHADOW_SIZE}px`;
      shadow.style.background = `linear-gradient(to top, ${dark}, ${clear})`;
    } else {
      shadow.style.bottom = `-${OVERLAY_SHADOW_SIZE}px`;
      shadow.style.background = `linear-gradient(to bottom, ${dark}, ${clear})`;
    }
  } else {
    shadow.style.top = "0";
    if (positive) {
      shadow.style.left = `-${OVERLAY_SHADOW_SIZE}px`;
      shadow.style.background = `linear-gradient(to left, ${dark}, ${clear})`;
    } else {
      shadow.style.right = `-${OVERLAY_SHADOW_SIZE}px`;
      shadow.style.background = `linear-gradient(to right, ${dark}, ${clear})`;
    }
  }
  return shadow;
};

const showOverlay = (
  ctrl: OverlayTurnController,
  shot: CaptureShot,
  motion: TurnMotion
) => {
  destroyOverlay(ctrl);
  const overlay = document.createElement("div");
  overlay.className = OVERLAY_CLASS_NAME;
  overlay.style.position = "fixed";
  overlay.style.left = `${shot.left}px`;
  overlay.style.top = `${shot.top}px`;
  overlay.style.width = `${shot.width}px`;
  overlay.style.height = `${shot.height}px`;
  // 阴影要落在浮层外的新页面上，所以不能裁掉溢出内容
  overlay.style.overflow = "visible";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "9999";
  overlay.style.willChange = "transform, opacity";
  overlay.style.transform = "translate3d(0, 0, 0)";
  overlay.style.backfaceVisibility = "hidden";
  const image = shot.image;
  image.style.display = "block";
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = "fill";
  overlay.appendChild(image);
  overlay.appendChild(createEdgeShadow(motion));
  document.body.appendChild(overlay);
  ctrl.overlay = overlay;
  // 强制布局，保证随后的 transform 过渡从 0 开始
  overlay.getBoundingClientRect();
};

const animateOverlayOut = (ctrl: OverlayTurnController, motion: TurnMotion) => {
  const overlay = ctrl.overlay;
  if (!overlay || !ctrl.active) return Promise.resolve();
  const distance = motion.vertical ? overlay.offsetHeight : overlay.offsetWidth;
  overlay.style.transition = `transform ${OVERLAY_TURN_DURATION}ms ${OVERLAY_EASING}, opacity ${OVERLAY_FADE_DURATION}ms linear ${OVERLAY_TURN_DURATION - OVERLAY_FADE_DURATION}ms`;
  overlay.style.opacity = "0";
  overlay.style.transform = motion.vertical
    ? `translate3d(0, ${motion.positive ? distance : -distance}px, 0)`
    : `translate3d(${motion.positive ? distance : -distance}px, 0, 0)`;
  return new Promise<void>((resolve) => {
    ctrl.removeTimer = window.setTimeout(() => {
      ctrl.removeTimer = null;
      destroyOverlay(ctrl);
      resolve();
    }, OVERLAY_TURN_DURATION);
  });
};

const performOverlayTurn = async (
  ctrl: OverlayTurnController,
  direction: "next" | "prev",
  original: (...args: any[]) => any,
  args: any[]
) => {
  if (typeof original !== "function") return undefined;
  if (
    !ctrl.active ||
    !isOverlayTurnEnabled() ||
    ctrl.readerMode === "scroll" ||
    ConfigService.getReaderConfig("isMergeWord") === "yes" ||
    isReadingAidMode(ctrl.book.format, ctrl.book.key)
  ) {
    return original.apply(ctrl.rendition, args);
  }
  // 上一段动画还没走完，直接丢弃这次翻页，避免动画中途再翻页造成画面跳变
  if (ctrl.busy) return undefined;
  ctrl.busy = true;
  let animating = false;
  clearCaptureTimer(ctrl);
  try {
    const before = getPageSignature(ctrl);
    let shot =
      ctrl.cachedShot && ctrl.cachedShot.signature === before
        ? ctrl.cachedShot
        : null;
    ctrl.cachedShot = null;
    if (!shot) {
      shot = await captureWindowView();
      if (shot && getPageSignature(ctrl) !== before) {
        shot = null;
      }
      if (shot) shot.signature = before;
    }
    if (!shot) {
      return await original.apply(ctrl.rendition, args);
    }
    if (!ctrl.active) return undefined;
    const motion = getTurnMotion(ctrl, direction);
    showOverlay(ctrl, shot, motion);
    const result = await original.apply(ctrl.rendition, args);
    if (!ctrl.active) return result;
    if (getPageSignature(ctrl) !== before) {
      // 不等待动画结束，避免与外部翻页锁叠加；动画期间由 busy 拦截新的翻页
      animating = true;
      animateOverlayOut(ctrl, motion)
        .catch(() => undefined)
        .then(() => {
          ctrl.busy = false;
          if (ctrl.active) schedulePreCapture(ctrl);
        });
    } else {
      destroyOverlay(ctrl);
    }
    return result;
  } catch (error) {
    destroyOverlay(ctrl);
    throw error;
  } finally {
    if (!animating) {
      ctrl.busy = false;
      if (ctrl.active) schedulePreCapture(ctrl);
    }
  }
};

export const setupOverlayTurn = (
  rendition: any,
  book: Book,
  readerMode: string
) => {
  teardownOverlayTurn();
  if (
    !rendition ||
    typeof rendition.next !== "function" ||
    typeof rendition.prev !== "function"
  ) {
    return;
  }
  const ctrl: OverlayTurnController = {
    rendition,
    book,
    readerMode,
    originalNext: rendition.next,
    originalPrev: rendition.prev,
    wrappedNext: () => undefined,
    wrappedPrev: () => undefined,
    onRendered: () => undefined,
    cachedShot: null,
    overlay: null,
    captureTimer: null,
    removeTimer: null,
    busy: false,
    active: true,
  };
  ctrl.wrappedNext = (...args: any[]) =>
    performOverlayTurn(ctrl, "next", ctrl.originalNext, args);
  ctrl.wrappedPrev = (...args: any[]) =>
    performOverlayTurn(ctrl, "prev", ctrl.originalPrev, args);
  ctrl.onRendered = () => schedulePreCapture(ctrl);
  rendition.next = ctrl.wrappedNext;
  rendition.prev = ctrl.wrappedPrev;
  rendition.on?.("rendered", ctrl.onRendered);
  controller = ctrl;
  if (isOverlayTurnEnabled()) schedulePreCapture(ctrl);
};

export const teardownOverlayTurn = () => {
  const ctrl = controller;
  if (!ctrl) return;
  controller = null;
  ctrl.active = false;
  clearCaptureTimer(ctrl);
  destroyOverlay(ctrl);
  ctrl.cachedShot = null;
  try {
    ctrl.rendition.off?.("rendered", ctrl.onRendered);
  } catch {
    // ignore
  }
  if (ctrl.rendition.next === ctrl.wrappedNext) {
    ctrl.rendition.next = ctrl.originalNext;
  }
  if (ctrl.rendition.prev === ctrl.wrappedPrev) {
    ctrl.rendition.prev = ctrl.originalPrev;
  }
};
