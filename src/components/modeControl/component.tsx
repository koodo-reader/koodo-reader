//阅读模式切换
import React from "react";
import "./modeControl.css";
import { Trans } from "react-i18next";
import { ModeControlProps, ModeControlState } from "./interface";
import OtherUtil from "../../utils/otherUtil";

class ModeControl extends React.Component<ModeControlProps, ModeControlState> {
  constructor(props: ModeControlProps) {
    super(props);
    this.state = {
      readerMode: OtherUtil.getReaderConfig("readerMode") || "double",
    };
  }

  handleChangeMode = (mode: string) => {
    this.setState({ readerMode: mode });
    OtherUtil.setReaderConfig("readerMode", mode);
    window.location.reload();
  };
  render() {
    return (
      <div className="single-control-container">
        <div
          className="single-mode-container"
          onClick={() => {
            this.handleChangeMode("single");
          }}
          style={this.state.readerMode === "single" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-single-page single-page-icon"></span>
          <div className="single-mode-text">
            <Trans>Single-Page Mode</Trans>
          </div>
        </div>
        <div
          className="double-mode-container"
          onClick={() => {
            this.handleChangeMode("double");
          }}
          style={this.state.readerMode === "double" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-two-page two-page-icon"></span>
          <div className="double-mode-text">
            <Trans>Double-Page Mode</Trans>
          </div>
        </div>
        <div
          className="double-mode-container"
          onClick={() => {
            this.handleChangeMode("scroll");
          }}
          style={this.state.readerMode === "scroll" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-scroll1 two-page-icon"></span>
          <div className="double-mode-text">
            <Trans>Chapter Scroll</Trans>
          </div>
        </div>
        <div
          className="double-mode-container"
          onClick={() => {
            this.handleChangeMode("continuous");
          }}
          style={this.state.readerMode === "continuous" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-scroll two-page-icon"></span>
          <div className="double-mode-text">
            <Trans>Continuous Scroll</Trans>
          </div>
        </div>
      </div>
    );
  }
}
export default ModeControl;
