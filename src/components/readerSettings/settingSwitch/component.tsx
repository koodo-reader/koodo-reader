//右侧阅读选项面板
import React from "react";
import "./settingSwitch.css";
import { SettingSwitchProps, SettingSwitchState } from "./interface";
import { Trans } from "react-i18next";
import TextToSpeech from "../../textToSpeech";
import OtherUtil from "../../../utils/otherUtil";

class SettingSwitch extends React.Component<
  SettingSwitchProps,
  SettingSwitchState
> {
  constructor(props: SettingSwitchProps) {
    super(props);
    this.state = {
      isBold: OtherUtil.getReaderConfig("isBold") === "yes",
      isUseBackground: OtherUtil.getReaderConfig("isUseBackground") === "yes",
      isShowFooter: OtherUtil.getReaderConfig("isShowFooter") !== "no",
      isShowHeader: OtherUtil.getReaderConfig("isShowHeader") !== "no",
    };
  }

  handleBold = () => {
    this.props.currentEpub.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-weight": `${this.state.isBold ? "bold !important" : ""}`,
      },
    });
    this.setState({ isBold: !this.state.isBold });
    OtherUtil.setReaderConfig("isBold", this.state.isBold ? "no" : "yes");
    window.location.reload();
  };
  handleChangeBackground = () => {
    this.setState({ isUseBackground: !this.state.isUseBackground });
    OtherUtil.setReaderConfig(
      "isUseBackground",
      this.state.isUseBackground ? "no" : "yes"
    );
    this.state.isUseBackground
      ? this.props.handleMessage("Turn Off Successfully")
      : this.props.handleMessage("Turn On Successfully");
    this.props.handleMessageBox(true);
    window.location.reload();
  };
  handleFooter = () => {
    this.setState({ isShowFooter: !this.state.isShowFooter });
    OtherUtil.setReaderConfig(
      "isShowFooter",
      this.state.isShowFooter ? "no" : "yes"
    );
    this.state.isShowFooter
      ? this.props.handleMessage("Turn On Successfully")
      : this.props.handleMessage("Turn Off Successfully");
    this.props.handleMessageBox(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  handleHeader = () => {
    this.setState({ isShowHeader: !this.state.isShowHeader });
    OtherUtil.setReaderConfig(
      "isShowHeader",
      this.state.isShowHeader ? "no" : "yes"
    );
    this.state.isShowHeader
      ? this.props.handleMessage("Turn On Successfully")
      : this.props.handleMessage("Turn Off Successfully");
    this.props.handleMessageBox(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  render() {
    return (
      <>
        <TextToSpeech />
        <div className="single-control-switch-container">
          <span className="single-control-switch-title">
            <Trans>Bold Font</Trans>
          </span>

          <span
            className="single-control-switch"
            onClick={() => {
              this.handleBold();
            }}
            style={
              this.state.isBold
                ? { background: "rgba(46, 170, 220)", float: "right" }
                : { float: "right" }
            }
          >
            <span
              className="single-control-button"
              style={
                !this.state.isBold
                  ? {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
              }
            ></span>
          </span>
        </div>
        <div className="single-control-switch-container">
          <span className="single-control-switch-title">
            <Trans>Don't show footer</Trans>
          </span>

          <span
            className="single-control-switch"
            onClick={() => {
              this.handleFooter();
            }}
            style={
              !this.state.isShowFooter
                ? { background: "rgba(46, 170, 220)", float: "right" }
                : { float: "right" }
            }
          >
            <span
              className="single-control-button"
              style={
                this.state.isShowFooter
                  ? {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
              }
            ></span>
          </span>
        </div>
        <div className="single-control-switch-container">
          <span className="single-control-switch-title">
            <Trans>Don't show header</Trans>
          </span>

          <span
            className="single-control-switch"
            onClick={() => {
              this.handleHeader();
            }}
            style={
              !this.state.isShowHeader
                ? { background: "rgba(46, 170, 220)", float: "right" }
                : { float: "right" }
            }
          >
            <span
              className="single-control-button"
              style={
                this.state.isShowHeader
                  ? {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
              }
            ></span>
          </span>
        </div>
        <div className="single-control-switch-container">
          <span className="single-control-switch-title">
            <Trans>Dont't use mimical background</Trans>
          </span>
          <span
            className="single-control-switch"
            onClick={() => {
              this.handleChangeBackground();
            }}
            style={
              this.state.isUseBackground
                ? { background: "rgba(46, 170, 220)", float: "right" }
                : { float: "right" }
            }
          >
            <span
              className="single-control-button"
              style={
                this.state.isUseBackground
                  ? {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
              }
            ></span>
          </span>
        </div>
      </>
    );
  }
}

export default SettingSwitch;
