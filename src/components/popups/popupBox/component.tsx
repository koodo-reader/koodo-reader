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

const POPUP_SIZE_KEY = "popupBoxSize";
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
  private isResizing: boolean = false;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;
  private resizeStartWidth: number = 0;
  private resizeStartHeight: number = 0;

  constructor(props: PopupBoxProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";

    const savedSize = this.getSavedSize();
    this.state = {
      deleteKey: "",
      rect: this.props.rect,
      isShowUrl: false,
      popupWidth: savedSize ? savedSize.width : DEFAULT_WIDTH,
      popupHeight: savedSize
        ? savedSize.height
        : getDefaultHeight(props.menuMode),
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

  componentDidMount(): void {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let isShowUrl = ipcRenderer.sendSync("url-window-status", {
        type: this.props.menuMode,
      });
      this.setState({ isShowUrl });
    }
    document.addEventListener("mousemove", this.handleResizeMove);
    document.addEventListener("mouseup", this.handleResizeEnd);
  }

  componentWillUnmount(): void {
    document.removeEventListener("mousemove", this.handleResizeMove);
    document.removeEventListener("mouseup", this.handleResizeEnd);
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
    const { popupWidth, popupHeight } = this.state;
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
            left: `calc(50% - ${popupWidth / 2}px)`,
          }}
        >
          {this.props.menuMode === "note" ? (
            <PopupNote {...PopupProps} />
          ) : this.props.menuMode === "trans" ? (
            <PopupTrans {...PopupProps} />
          ) : this.props.menuMode === "dict" ? (
            <PopupDict {...PopupProps} />
          ) : this.props.menuMode === "assistant" ? (
            <PopupAssist {...PopupProps} />
          ) : null}
          <span
            className="icon-close popup-close"
            onClick={() => {
              this.handleClose();
            }}
            style={{ top: "-30px", left: "calc(50% - 10px)" }}
          ></span>
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
