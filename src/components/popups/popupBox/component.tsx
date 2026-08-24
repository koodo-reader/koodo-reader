import React from "react";
import "./popupMenu.css";
import PopupNote from "../popupNote";
import PopupTrans from "../popupTrans";
import PopupDict from "../popupDict";
import { PopupBoxProps, PopupBoxStates } from "./interface";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import PopupAssist from "../popupAssist";
import { isElectron } from "react-device-detect";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

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

class PopupBox extends React.Component<PopupBoxProps, PopupBoxStates> {
  highlighter: any;
  timer!: NodeJS.Timeout;
  key: any;
  mode: string;
  showNote: boolean;
  isFirstShow: boolean;
  rect: any;
  isResizing: boolean = false;
  resizeStartX: number = 0;
  resizeStartY: number = 0;
  resizeStartWidth: number = 0;
  resizeStartHeight: number = 0;
  isDragging: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  dragStartLeft: number = 0;
  dragStartBottom: number = 0;
  wasDocked: boolean = false;

  constructor(props: PopupBoxProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = POPUP_MODES.includes(props.menuMode)
      ? props.menuMode
      : "assistant";

    const savedSize = this.getSavedSize();
    const savedPos = this.getSavedPosition();
    this.state = {
      deleteKey: "",
      rect: this.props.rect,
      isShowUrl: false,
      popupWidth: savedSize ? savedSize.width : DEFAULT_WIDTH,
      popupHeight: savedSize
        ? savedSize.height
        : getDefaultHeight(props.menuMode),
      popupLeft: savedPos ? savedPos.left : 50,
      popupBottom: savedPos ? savedPos.bottom : 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      isNearBottom: false,
      isNearRight: false,
      isDockedRight: this.props.isDockedRight,
    };
  }

  getSavedSize(): { width: number; height: number } | null {
    try {
      const saved = ConfigService.getReaderConfig(POPUP_SIZE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.width && parsed.height) return parsed;
      }
    } catch (e) {}
    return null;
  }

  saveSizeToConfig(width: number, height: number) {
    try {
      ConfigService.setReaderConfig(
        POPUP_SIZE_KEY,
        JSON.stringify({ width, height })
      );
    } catch (e) {}
  }

  getSavedPosition(): { left: number; bottom: number } | null {
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

  savePositionToConfig(left: number, bottom: number) {
    try {
      ConfigService.setReaderConfig(
        POPUP_POS_KEY,
        JSON.stringify({ left, bottom })
      );
    } catch (e) {}
  }

  getSavedDocked(): boolean {
    try {
      return ConfigService.getReaderConfig("isDockedRight") === "yes";
    } catch (e) {}
    return false;
  }

  saveDockedToConfig(docked: boolean) {
    try {
      ConfigService.setReaderConfig("isDockedRight", docked ? "yes" : "no");
    } catch (e) {}
  }

  syncDockedToRedux(docked: boolean) {
    this.saveDockedToConfig(docked);
    this.props.handleDockedRight(docked);
    if (docked) {
      setTimeout(() => {
        this.props.renderBookFunc();
      }, 300);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: PopupBoxProps) {
    if (POPUP_MODES.includes(nextProps.menuMode)) {
      this.mode = nextProps.menuMode;
    }
  }

  componentDidMount(): void {
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      let isShowUrl = ipcRenderer.sendSync("url-window-status", {
        type: this.props.menuMode,
      });
      this.setState({ isShowUrl });
    }
    document.addEventListener("mousemove", this.handleResizeMove);
    document.addEventListener("mousemove", this.handleDragMove);
    document.addEventListener("mouseup", this.handleResizeEnd);
    document.addEventListener("mouseup", this.handleDragEnd);
  }

  componentWillUnmount(): void {
    document.removeEventListener("mousemove", this.handleResizeMove);
    document.removeEventListener("mousemove", this.handleDragMove);
    document.removeEventListener("mouseup", this.handleResizeEnd);
    document.removeEventListener("mouseup", this.handleDragEnd);
  }

  handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = true;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.resizeStartWidth = this.state.popupWidth;
    this.resizeStartHeight = this.state.popupHeight;
  };

  handleResizeMove = (e: MouseEvent) => {
    if (!this.isResizing) return;
    // Dragging top-right corner: right edge extends right (+dx), top edge moves up (-dy means bigger height)
    const dx = e.clientX - this.resizeStartX;
    const dy = e.clientY - this.resizeStartY;
    const newWidth = Math.max(300, this.resizeStartWidth + dx);
    const newHeight = Math.max(200, this.resizeStartHeight - dy);
    this.setState({ popupWidth: newWidth, popupHeight: newHeight });
  };

  handleResizeEnd = (_e: MouseEvent) => {
    if (!this.isResizing) return;
    this.isResizing = false;
    this.saveSizeToConfig(this.state.popupWidth, this.state.popupHeight);
  };

  handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.isDockedRight) {
      const { popupWidth, popupHeight } = this.state;
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

      this.dragStartLeft = newLeft;
      this.dragStartBottom = newBottom;
      this.isDragging = true;
      this.wasDocked = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.props.handleMenuMode("assistant");
      this.props.handleOpenMenu(true);
      this.setState({
        isDockedRight: false,
        popupLeft: newLeft,
        popupBottom: newBottom,
      });
      this.syncDockedToRedux(false);
      return;
    }
    this.isDragging = true;
    this.wasDocked = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartLeft = this.state.popupLeft;
    this.dragStartBottom = this.state.popupBottom;
  };

  handleDragMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    const newLeft = Math.max(
      0,
      Math.min(100, this.dragStartLeft + (dx / window.innerWidth) * 100)
    );
    const newBottom = Math.max(
      0,
      this.dragStartBottom - (dy / window.innerHeight) * 100
    );

    const bottomPx = (newBottom / 100) * window.innerHeight;
    const isNearBottom = bottomPx < SNAP_THRESHOLD_PX;

    const rightEdgePx =
      (newLeft / 100) * window.innerWidth + this.state.popupWidth / 2;
    const isNearRight =
      window.innerWidth - rightEdgePx < RIGHT_SNAP_THRESHOLD_PX;

    this.setState({
      popupLeft: newLeft,
      popupBottom: newBottom,
      isNearBottom,
      isNearRight,
    });
  };

  handleDragEnd = (_e: MouseEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    let { popupLeft, popupBottom, popupWidth } = this.state;

    const rightEdgePx = (popupLeft / 100) * window.innerWidth + popupWidth / 2;
    if (window.innerWidth - rightEdgePx < RIGHT_SNAP_THRESHOLD_PX) {
      this.setState({
        isDockedRight: true,
        isNearRight: false,
        isNearBottom: false,
      });
      this.syncDockedToRedux(true);
      return;
    }

    const bottomPx = (popupBottom / 100) * window.innerHeight;
    if (bottomPx < SNAP_THRESHOLD_PX) {
      popupBottom = 0;
    }
    this.setState({
      popupLeft,
      popupBottom,
      isNearBottom: false,
      isNearRight: false,
    });
    this.savePositionToConfig(popupLeft, popupBottom);

    // 从固定右侧状态拖出后松手（未重新吸附），刷新书籍布局
    if (this.wasDocked) {
      this.wasDocked = false;
      setTimeout(() => {
        this.props.renderBookFunc();
      }, 300);
    }
  };

  handleToggleDock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.isDockedRight) {
      // 当前已固定 → 取消固定，恢复到之前保存的位置
      const savedPos = this.getSavedPosition();
      const savedSize = this.getSavedSize();
      this.setState({
        isDockedRight: false,
        popupLeft: savedPos ? savedPos.left : 50,
        popupBottom: savedPos ? savedPos.bottom : 0,
        popupWidth: savedSize ? savedSize.width : DEFAULT_WIDTH,
        popupHeight: savedSize ? savedSize.height : getDefaultHeight(this.mode),
      });
      this.syncDockedToRedux(false);
      this.props.renderBookFunc();
    } else {
      // 当前未固定 → 直接固定到右侧
      this.syncDockedToRedux(true);
    }
  };

  handleClose() {
    this.props.handleOpenMenu(false);
    this.props.handleNoteKey("");
    this.props.handleMenuMode("");
    let docs = getIframeDoc(this.props.currentBook.format);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      doc.getSelection()?.empty();
    }
  }
  render() {
    const {
      popupWidth,
      popupHeight,
      popupLeft,
      popupBottom,
      isNearRight,
      isDockedRight,
    } = this.state;
    const menuMode = isDockedRight ? this.mode : this.props.menuMode;
    const PopupProps = {
      chapterDocIndex: this.props.chapterDocIndex,
      chapter: this.props.chapter,
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
            this.props.isNavLocked && !this.props.isSettingLocked
              ? 150
              : !this.props.isNavLocked && this.props.isSettingLocked
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
            this.state.isShowUrl &&
            (menuMode === "dict" || menuMode === "trans")
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
              this.handleClose();
            }}
            style={{
              ...(isDockedRight
                ? { display: "none" }
                : { top: "-30px", left: "calc(50% - 10px)" }),
            }}
          ></span>
          <span
            className={`icon-sidebar popup-pin-handle ${isDockedRight ? "" : "popup-close"}`}
            onClick={this.handleToggleDock}
            title={this.props.t(isDockedRight ? "Unpin" : "Pin to right")}
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
            onMouseDown={this.handleDragStart}
            title={this.props.t("Move")}
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
              onMouseDown={this.handleResizeStart}
              title={this.props.t("Resize")}
            />
          )}
        </div>
        {!isDockedRight && (
          <div
            className="drag-background"
            onClick={() => {
              this.handleClose();
            }}
          ></div>
        )}
      </div>
    );
  }
}

export default PopupBox;
