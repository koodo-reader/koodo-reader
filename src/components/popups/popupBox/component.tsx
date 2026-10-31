import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import "./popupMenu.css";
import PopupNote from "../popupNote";
import PopupTrans from "../popupTrans";
import PopupDict from "../popupDict";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import PopupAssist from "../popupAssist";
import { isElectron } from "react-device-detect";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { useAppStore } from "../../../store/useAppStore";

export interface PopupBoxProps {
  rendition: any;
  // cfiRange: any;
  rect: any;

  chapterDocIndex: number;
  chapter: string;
}

export interface PopupBoxStates {
  deleteKey: string;
  rect: DOMRect | null;
  isShowUrl: boolean;
  popupWidth: number;
  popupHeight: number;
  popupLeft: number;
  popupBottom: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  isNearBottom: boolean;
  isNearRight: boolean;
  isDockedRight: boolean;
}

const SNAP_THRESHOLD_PX = 50;
const RIGHT_SNAP_THRESHOLD_PX = 50;
const SETTING_PANEL_WIDTH = 299;

const POPUP_SIZE_KEY = "popupBoxSize";
const POPUP_POS_KEY = "popupBoxPosition";
const DEFAULT_WIDTH = 500;
const POPUP_MODES = ["note", "trans", "dict", "assistant"];

function getDefaultHeight(menuMode: string) {
  if (menuMode === "assistant") return 400;
  if (menuMode === "note") return 360;
  return 320;
}

function getSavedSize(): { width: number; height: number } | null {
  try {
    const saved = ConfigService.getReaderConfig(POPUP_SIZE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.width && parsed.height) return parsed;
    }
  } catch (e) {}
  return null;
}

function saveSizeToConfig(width: number, height: number) {
  try {
    ConfigService.setReaderConfig(
      POPUP_SIZE_KEY,
      JSON.stringify({ width, height })
    );
  } catch (e) {}
}

function getSavedPosition(): { left: number; bottom: number } | null {
  try {
    const saved = ConfigService.getReaderConfig(POPUP_POS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.left !== undefined && parsed.bottom !== undefined)
        return parsed;
    }
  } catch (e) {}
  return null;
}

function savePositionToConfig(left: number, bottom: number) {
  try {
    ConfigService.setReaderConfig(
      POPUP_POS_KEY,
      JSON.stringify({ left, bottom })
    );
  } catch (e) {}
}

function saveDockedToConfig(docked: boolean) {
  try {
    ConfigService.setReaderConfig("isDockedRight", docked ? "yes" : "no");
  } catch (e) {}
}

const PopupBox = (props: PopupBoxProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const storeMenuMode = useAppStore((s) => s.viewArea.menuMode);
  const isNavLocked = useAppStore((s) => s.reader.isNavLocked);
  const isSettingLocked = useAppStore((s) => s.reader.isSettingLocked);
  const storeIsDockedRight = useAppStore((s) => s.reader.isDockedRight);
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleOpenMenu = useAppStore((s) => s.handleOpenMenu);
  const handleMenuMode = useAppStore((s) => s.handleMenuMode);
  const handleNoteKey = useAppStore((s) => s.handleNoteKey);
  const handleDockedRight = useAppStore((s) => s.handleDockedRight);
  const { t } = useTranslation();
  const [state, setState] = useState<PopupBoxStates>(() => {
    const savedSize = getSavedSize();
    const savedPos = getSavedPosition();
    return {
      deleteKey: "",
      rect: props.rect,
      isShowUrl: false,
      popupWidth: savedSize ? savedSize.width : DEFAULT_WIDTH,
      popupHeight: savedSize
        ? savedSize.height
        : getDefaultHeight(storeMenuMode),
      popupLeft: savedPos ? savedPos.left : 50,
      popupBottom: savedPos ? savedPos.bottom : 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      isNearBottom: false,
      isNearRight: false,
      isDockedRight: storeIsDockedRight,
    };
  });
  const [mode, setMode] = useState<string>(() =>
    POPUP_MODES.includes(storeMenuMode) ? storeMenuMode : "assistant"
  );

  const stateRef = useRef(state);
  const propsRef = useLatest(props);

  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, bottom: 0 });
  const wasDocked = useRef(false);

  const updateState = (patch: Partial<PopupBoxStates>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState((prev) => ({ ...prev, ...patch }));
  };

  const syncDockedToRedux = (docked: boolean) => {
    saveDockedToConfig(docked);
    handleDockedRight(docked);
    if (docked) {
      setTimeout(() => {
        renderBookFunc();
      }, 300);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: stateRef.current.popupWidth,
      height: stateRef.current.popupHeight,
    };
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    // Dragging top-right corner: right edge extends right (+dx), top edge moves up (-dy means bigger height)
    const dx = e.clientX - resizeStart.current.x;
    const dy = e.clientY - resizeStart.current.y;
    const newWidth = Math.max(300, resizeStart.current.width + dx);
    const newHeight = Math.max(200, resizeStart.current.height - dy);
    updateState({ popupWidth: newWidth, popupHeight: newHeight });
  };

  const handleResizeEnd = (_e: MouseEvent) => {
    if (!isResizing.current) return;
    isResizing.current = false;
    saveSizeToConfig(
      stateRef.current.popupWidth,
      stateRef.current.popupHeight
    );
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stateRef.current.isDockedRight) {
      const { popupWidth, popupHeight } = stateRef.current;
      // 移动图标中心在 popup 内的偏移：right:24px, width:18px, top:0, height:18px
      // 图标中心距 popup 左边缘 = popupWidth - 24 - 9 = popupWidth - 33
      // 图标中心距 popup 上边缘 = 9
      // 反推：让图标中心对齐鼠标，计算 popup 的 left% 和 bottom%
      const rawLeft =
        ((e.clientX - popupWidth / 2 + 33) / window.innerWidth) * 100;
      const newLeft = Math.max(0, Math.min(100, rawLeft));
      const rawBottom =
        ((window.innerHeight - e.clientY - popupHeight + 9) /
          window.innerHeight) *
        100;
      const newBottom = Math.max(0, rawBottom);

      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        left: newLeft,
        bottom: newBottom,
      };
      isDragging.current = true;
      wasDocked.current = true;
      handleMenuMode("assistant");
      handleOpenMenu(true);
      updateState({
        isDockedRight: false,
        popupLeft: newLeft,
        popupBottom: newBottom,
      });
      syncDockedToRedux(false);
      return;
    }
    isDragging.current = true;
    wasDocked.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      left: stateRef.current.popupLeft,
      bottom: stateRef.current.popupBottom,
    };
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newLeft = Math.max(
      0,
      Math.min(100, dragStart.current.left + (dx / window.innerWidth) * 100)
    );
    const newBottom = Math.max(
      0,
      dragStart.current.bottom - (dy / window.innerHeight) * 100
    );

    const bottomPx = (newBottom / 100) * window.innerHeight;
    const isNearBottom = bottomPx < SNAP_THRESHOLD_PX;

    const rightEdgePx =
      (newLeft / 100) * window.innerWidth + stateRef.current.popupWidth / 2;
    const isNearRight =
      window.innerWidth - rightEdgePx < RIGHT_SNAP_THRESHOLD_PX;

    updateState({
      popupLeft: newLeft,
      popupBottom: newBottom,
      isNearBottom,
      isNearRight,
    });
  };

  const handleDragEnd = (_e: MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    let { popupLeft, popupBottom, popupWidth } = stateRef.current;

    const rightEdgePx = (popupLeft / 100) * window.innerWidth + popupWidth / 2;
    if (window.innerWidth - rightEdgePx < RIGHT_SNAP_THRESHOLD_PX) {
      updateState({
        isDockedRight: true,
        isNearRight: false,
        isNearBottom: false,
      });
      syncDockedToRedux(true);
      return;
    }

    const bottomPx = (popupBottom / 100) * window.innerHeight;
    if (bottomPx < SNAP_THRESHOLD_PX) {
      popupBottom = 0;
    }
    updateState({
      popupLeft,
      popupBottom,
      isNearBottom: false,
      isNearRight: false,
    });
    savePositionToConfig(popupLeft, popupBottom);

    // 从固定右侧状态拖出后松手（未重新吸附），刷新书籍布局
    if (wasDocked.current) {
      wasDocked.current = false;
      setTimeout(() => {
        renderBookFunc();
      }, 300);
    }
  };

  const handleToggleDock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stateRef.current.isDockedRight) {
      // 当前已固定 → 取消固定，恢复到之前保存的位置
      const savedPos = getSavedPosition();
      const savedSize = getSavedSize();
      updateState({
        isDockedRight: false,
        popupLeft: savedPos ? savedPos.left : 50,
        popupBottom: savedPos ? savedPos.bottom : 0,
        popupWidth: savedSize ? savedSize.width : DEFAULT_WIDTH,
        popupHeight: savedSize ? savedSize.height : getDefaultHeight(mode),
      });
      syncDockedToRedux(false);
      renderBookFunc();
    } else {
      // 当前未固定 → 直接固定到右侧
      updateState({
        isDockedRight: true,
        isNearRight: false,
        isNearBottom: false,
      });
      syncDockedToRedux(true);
    }
  };

  const handleClose = () => {
    handleOpenMenu(false);
    handleNoteKey("");
    handleMenuMode("");
    let docs = getIframeDoc(currentBook);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      doc.getSelection()?.empty();
    }
  };

  useEffect(() => {
    if (POPUP_MODES.includes(storeMenuMode)) {
      setMode(storeMenuMode);
    }
  }, [storeMenuMode]);

  useEffect(() => {
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      let isShowUrl = ipcRenderer.sendSync("url-window-status", {
        type: storeMenuMode,
      });
      updateState({ isShowUrl });
    }
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleResizeEnd);
    document.addEventListener("mouseup", handleDragEnd);

    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.removeEventListener("mouseup", handleDragEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    popupWidth,
    popupHeight,
    popupLeft,
    popupBottom,
    isNearRight,
    isDockedRight,
    isShowUrl,
  } = state;
  const menuMode = isDockedRight ? mode : storeMenuMode;
  const PopupProps = {
    chapterDocIndex: props.chapterDocIndex,
    chapter: props.chapter,
    isDockedRight,
  };
  const isAtBottom = popupBottom === 0;

  const containerStyle: React.CSSProperties = isDockedRight
    ? {
        position: "fixed",
        right: 0,
        top: 0,
        left: "auto",
        bottom: 0,
        width: SETTING_PANEL_WIDTH,
        height: "100%",
        transform: "none",
        borderRadius: "10px 0 0 10px",
        marginLeft: 0,
        transition: "none",
      }
    : {
        marginLeft:
          isNavLocked && !isSettingLocked
            ? 150
            : !isNavLocked && isSettingLocked
              ? -150
              : 0,
        width: popupWidth,
        height: popupHeight,
        left: `${popupLeft}%`,
        bottom: `${popupBottom}%`,
        transform: "translateX(-50%)",
        borderBottomLeftRadius: isAtBottom ? 0 : 10,
        borderBottomRightRadius: isAtBottom ? 0 : 10,
        outline: isNearRight
          ? "6px solid var(--color-primary, #5c9ee6)"
          : "none",
      };

  return (
    <div
      style={{
        display:
          isShowUrl && (menuMode === "dict" || menuMode === "trans")
            ? "none"
            : "block",
      }}
    >
      <div className={`popup-box-container`} style={containerStyle}>
        {menuMode === "note" ? (
          <PopupNote {...(PopupProps as any)} />
        ) : menuMode === "trans" ? (
          <PopupTrans {...(PopupProps as any)} />
        ) : menuMode === "dict" ? (
          <PopupDict {...(PopupProps as any)} />
        ) : menuMode === "assistant" ? (
          <PopupAssist {...(PopupProps as any)} />
        ) : null}
        <span
          className="icon-close popup-close"
          onClick={() => {
            handleClose();
          }}
          style={{
            ...(isDockedRight
              ? { display: "none" }
              : { top: "-30px", left: "calc(50% - 10px)" }),
          }}
        ></span>
        <span
          className={`icon-sidebar popup-pin-handle ${isDockedRight ? "" : "popup-close"}`}
          onClick={handleToggleDock}
          title={t(isDockedRight ? "Unpin" : "Pin to right")}
          style={
            isDockedRight
              ? {
                  right: "40px",
                }
              : {
                  top: "-30px",
                  right: "40px",
                }
          }
        ></span>
        <span
          className={`icon-menu popup-drag-handle ${isDockedRight ? "" : "popup-close"}`}
          onMouseDown={handleDragStart}
          title={t("Move")}
          style={
            isDockedRight
              ? {
                  right: "10px",
                }
              : {
                  top: "-30px",
                  right: "10px",
                }
          }
        ></span>

        {!isDockedRight && (
          <div
            className="popup-resize-handle"
            onMouseDown={handleResizeStart}
            title={t("Resize")}
          />
        )}
      </div>
      {!isDockedRight && (
        <div
          className="drag-background"
          onClick={() => {
            handleClose();
          }}
        ></div>
      )}
    </div>
  );
};

export default PopupBox;
