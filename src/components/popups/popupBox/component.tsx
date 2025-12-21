import React from "react";
import "./popupMenu.css";
import PopupNote from "../popupNote";
import PopupTrans from "../popupTrans";
import PopupDict from "../popupDict";
import { PopupBoxProps, PopupBoxStates } from "./interface";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import PopupAssist from "../popupAssist";
import { isElectron } from "react-device-detect";

class PopupBox extends React.Component<PopupBoxProps, PopupBoxStates> {
  highlighter: any;
  timer!: NodeJS.Timeout;
  key: any;
  mode: string;
  showNote: boolean;
  isFirstShow: boolean;
  rect: any;
  constructor(props: PopupBoxProps) {
    super(props);
    this.showNote = false;
    this.isFirstShow = false;
    this.highlighter = null;
    this.mode = "";
    this.state = {
      deleteKey: "",
      rect: this.props.rect,
      isShowUrl: false,
    };
  }
  componentDidMount(): void {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let isShowUrl = ipcRenderer.sendSync("url-window-status", {
        type: this.props.menuMode,
      });
      this.setState({ isShowUrl });
    }
  }
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
            height:
              this.props.menuMode === "assistant"
                ? "400px"
                : this.props.menuMode === "note"
                ? "360px"
                : "320px",
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
