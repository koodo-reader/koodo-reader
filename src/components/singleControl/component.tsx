//单双页切换
import React from "react";
import "./singleControl.css";
import { Trans } from "react-i18next";
import { SingleControlProps, SingleControlState } from "./interface";
import OtherUtil from "../../utils/otherUtil";

class SingleControl extends React.Component<
  SingleControlProps,
  SingleControlState
> {
  constructor(props: SingleControlProps) {
    super(props);
    this.state = {
      isSingle: OtherUtil.getReaderConfig("isSingle") === "single",
      isScroll: OtherUtil.getReaderConfig("isScroll") === "yes",
    };
  }

  handleChangeMode = (mode: string) => {
    this.props.handleSingle(mode);
    this.setState({ isSingle: mode === "single" });
    OtherUtil.setReaderConfig("isSingle", mode);
    if (mode !== "single") {
      OtherUtil.setReaderConfig("isScroll", "no");
    }
    this.props.handleMessage("Try refresh or restart");
    this.props.handleMessageBox(true);
  };
  handleChangeScroll = () => {
    OtherUtil.setReaderConfig("isScroll", this.state.isScroll ? "no" : "yes");
    this.setState({ isScroll: !this.state.isScroll });
    this.props.handleMessage("Try refresh or restart");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="single-control-container">
        <div
          className="single-mode-container"
          onClick={() => {
            this.handleChangeMode("single");
          }}
          style={!this.state.isSingle ? { opacity: 0.4 } : {}}
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
          style={this.state.isSingle ? { opacity: 0.4 } : {}}
        >
          <span className="icon-two-page two-page-icon"></span>
          <div className="double-mode-text">
            <Trans>Double-Page Mode</Trans>
          </div>
        </div>
        {this.state.isSingle ? (
          <div className="single-control-switch-container">
            <span className="single-control-switch-title">
              {this.state.isScroll ? (
                <Trans>Turn off scroll mode</Trans>
              ) : (
                <Trans>Turn on scroll mode</Trans>
              )}
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                this.handleChangeScroll();
              }}
            >
              <span
                className="single-control-button"
                style={this.state.isScroll ? { float: "right" } : {}}
              ></span>
            </span>
          </div>
        ) : null}
      </div>
    );
  }
}
export default SingleControl;
