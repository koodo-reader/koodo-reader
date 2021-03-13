//阅读模式切换
import React from "react";
import "./modeControl.css";
import { ModeControlProps, ModeControlState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import { Trans } from "react-i18next";

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
      <div className="background-color-setting">
        <div
          className="background-color-text"
          style={{ position: "relative", bottom: "15px" }}
        >
          <Trans>View Mode</Trans>
        </div>
        <div className="single-control-container">
          <div
            className="single-mode-container"
            onClick={() => {
              this.handleChangeMode("single");
            }}
            style={this.state.readerMode === "single" ? {} : { opacity: 0.4 }}
          >
            <span className="icon-single-page single-page-icon"></span>
          </div>
          <div
            className="double-mode-container"
            onClick={() => {
              this.handleChangeMode("double");
            }}
            style={this.state.readerMode === "double" ? {} : { opacity: 0.4 }}
          >
            <span className="icon-two-page two-page-icon"></span>
          </div>

          <div
            className="double-mode-container"
            onClick={() => {
              this.handleChangeMode("continuous");
            }}
            style={
              this.state.readerMode === "continuous" ? {} : { opacity: 0.4 }
            }
          >
            <span className="icon-scroll two-page-icon"></span>
          </div>
        </div>
      </div>
    );
  }
}
export default ModeControl;
