//单双页切换
import React from "react";
import "./singleControl.css";
import { Trans } from "react-i18next";
import { SingleControlProps, SingleControlState } from "./interface";
class SingleControl extends React.Component<
  SingleControlProps,
  SingleControlState
> {
  constructor(props: SingleControlProps) {
    super(props);
    this.state = { isSingle: localStorage.getItem("isSingle") === "single" };
  }

  handleClick = (mode: string) => {
    this.props.handleSingle(mode);
    this.setState({ isSingle: mode === "single" });
    localStorage.setItem("isSingle", mode);
    this.props.handleMessage("Try Refresh or Restart");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="single-control-container">
        <div
          className="single-mode-container"
          onClick={() => {
            this.handleClick("single");
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
            this.handleClick("double");
          }}
          style={this.state.isSingle ? { opacity: 0.4 } : {}}
        >
          <span className="icon-two-page two-page-icon"></span>
          <div className="double-mode-text">
            <Trans>Double-Page Mode</Trans>
          </div>
        </div>
      </div>
    );
  }
}
export default SingleControl;
