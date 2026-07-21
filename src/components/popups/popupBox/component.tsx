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
import { throttle } from "../../../utils/common";

const SNAP_THRESHOLD = 5; // 吸附阈值（百分比）

const POPUP_SIZE_KEY = "popupBoxSize";
const POPUP_POS_KEY = "popupBoxPosition";
const DEFAULT_WIDTH = 500;

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

  constructor(props: PopupBoxProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";

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
        if (parsed.left !== undefined && parsed.bottom !== undefined) return parsed;
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

  componentDidMount(): void {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
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
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartLeft = this.state.popupLeft;
    this.dragStartBottom = this.state.popupBottom;
  };

  handleDragMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    const newLeft = Math.max(0, Math.min(100, this.dragStartLeft + (dx / window.innerWidth) * 100));
    const newBottom = Math.max(0, this.dragStartBottom - (dy / window.innerHeight) * 100);
    this.setState({ popupLeft: newLeft, popupBottom: newBottom });
  };

  handleDragEnd = (_e: MouseEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    let { popupLeft, popupBottom } = this.state;
    // 靠近底部时自动吸附回底部
    if (popupBottom < SNAP_THRESHOLD) {
      popupBottom = 0;
    }
    this.setState({ popupLeft, popupBottom });
    this.savePositionToConfig(popupLeft, popupBottom);
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
    const PopupProps = {
      chapterDocIndex: this.props.chapterDocIndex,
      chapter: this.props.chapter,
    };
    const { popupWidth, popupHeight, popupLeft, popupBottom } = this.state;
    const isAtBottom = popupBottom === 0;
    return (
      <div
        style={{
          display:
            this.state.isShowUrl &&
            (this.props.menuMode === "dict" || this.props.menuMode === "trans")
              ? "none"
              : "block",
        }}
      >
        <div
          className="popup-box-container"
          style={{
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
          }}
        >
          {this.props.menuMode === "note" ? (
            <PopupNote {...(PopupProps as any)} />
          ) : this.props.menuMode === "trans" ? (
            <PopupTrans {...(PopupProps as any)} />
          ) : this.props.menuMode === "dict" ? (
            <PopupDict {...(PopupProps as any)} />
          ) : this.props.menuMode === "assistant" ? (
            <PopupAssist {...(PopupProps as any)} />
          ) : null}
          <span
            className="icon-close popup-close"
            onClick={() => {
              this.handleClose();
            }}
            style={{ top: "-30px", left: "calc(50% - 10px)" }}
          ></span>
          <div
            className="popup-drag-handle"
            onMouseDown={this.handleDragStart}
            title="移动"
          >
            <span className="icon-menu"></span>
          </div>
          <div
            className="popup-resize-handle"
            onMouseDown={this.handleResizeStart}
            title=""
          />
        </div>
        <div
          className="drag-background"
          onClick={() => {
            this.handleClose();
          }}
        ></div>
      </div>
    );
  }
}

export default PopupBox;
