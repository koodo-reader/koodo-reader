import React from "react";
import "./modeControl.css";
import { ModeControlProps, ModeControlState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { Trans } from "react-i18next";

import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";

class ModeControl extends React.Component<ModeControlProps, ModeControlState> {
  constructor(props: ModeControlProps) {
    super(props);
    this.state = {
      readerMode: StorageUtil.getReaderConfig("readerMode") || "double",
    };
  }

  handleChangeMode = (mode: string) => {
    this.setState({ readerMode: mode });
    StorageUtil.setReaderConfig("readerMode", mode);
    if (isElectron) {
      toast(this.props.t("Take effect at next startup"));
    } else {
      window.location.reload();
    }
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
              this.handleChangeMode("scroll");
            }}
            style={this.state.readerMode === "scroll" ? {} : { opacity: 0.4 }}
          >
            <span className="icon-scroll two-page-icon"></span>
          </div>
        </div>
      </div>
    );
  }
}
export default ModeControl;
