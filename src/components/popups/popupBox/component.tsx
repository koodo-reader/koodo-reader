import React from "react";
import "./popupMenu.css";
import PopupNote from "../popupNote";
import PopupTrans from "../popupTrans";
import PopupDict from "../popupDict";
import { PopupBoxProps, PopupBoxStates } from "./interface";

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
    };
  }

  render() {
    const PopupProps = {
      chapterDocIndex: this.props.chapterDocIndex,
      chapter: this.props.chapter,
    };
    return (
      <>
        <div
          className="popup-box-container"
          // style={this.props.isOpenMenu ? {} : { display: "none" }}
        >
          {this.props.menuMode === "note" ? (
            <PopupNote {...PopupProps} />
          ) : this.props.menuMode === "trans" ? (
            <PopupTrans {...PopupProps} />
          ) : this.props.menuMode === "dict" ? (
            <PopupDict {...PopupProps} />
          ) : null}
          <span
            className="icon-close popup-close"
            onClick={() => {
              this.props.handleOpenMenu(false);
            }}
            style={{ top: "-30px", left: "calc(50% - 10px)" }}
          ></span>
        </div>
        <div
          className="drag-background"
          onClick={() => {
            this.props.handleOpenMenu(false);
          }}
        ></div>
      </>
    );
  }
}

export default PopupBox;
