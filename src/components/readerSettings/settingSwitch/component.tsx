//右侧阅读选项面板
import React from "react";
import { SettingSwitchProps, SettingSwitchState } from "./interface";
import { Trans } from "react-i18next";
import TextToSpeech from "../../textToSpeech";
import OtherUtil from "../../../utils/otherUtil";
import { readerSettingList } from "../../../constants/settingList";

class SettingSwitch extends React.Component<
  SettingSwitchProps,
  SettingSwitchState
> {
  constructor(props: SettingSwitchProps) {
    super(props);
    this.state = {
      isBold: OtherUtil.getReaderConfig("isBold") === "yes",
      isUnderline: OtherUtil.getReaderConfig("isUnderline") === "yes",
      isShadow: OtherUtil.getReaderConfig("isShadow") === "yes",
      isItalic: OtherUtil.getReaderConfig("isItalic") === "yes",
      isUseBackground: OtherUtil.getReaderConfig("isUseBackground") === "yes",
      isHideFooter: OtherUtil.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: OtherUtil.getReaderConfig("isHideHeader") === "yes",
    };
  }

  handleBold = () => {
    this.setState({ isBold: !this.state.isBold }, () => {
      OtherUtil.setReaderConfig("isBold", this.state.isBold ? "yes" : "no");
    });
  };
  handleItalic = () => {
    this.setState({ isItalic: !this.state.isItalic }, () => {
      OtherUtil.setReaderConfig("isItalic", this.state.isItalic ? "yes" : "no");
      window.location.reload();
    });
  };
  handleShadow = () => {
    this.setState({ isShadow: !this.state.isShadow }, () => {
      OtherUtil.setReaderConfig("isShadow", this.state.isShadow ? "yes" : "no");
      window.location.reload();
    });
  };
  handleUnderline = () => {
    this.setState({ isUnderline: !this.state.isUnderline }, () => {
      OtherUtil.setReaderConfig(
        "isUnderline",
        this.state.isUnderline ? "yes" : "no"
      );
      window.location.reload();
    });
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
    this.setState({ isHideFooter: !this.state.isHideFooter });
    OtherUtil.setReaderConfig(
      "isHideFooter",
      this.state.isHideFooter ? "no" : "yes"
    );
    this.state.isHideFooter
      ? this.props.handleMessage("Turn On Successfully")
      : this.props.handleMessage("Turn Off Successfully");
    this.props.handleMessageBox(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  handleHeader = () => {
    this.setState({ isHideHeader: !this.state.isHideHeader });
    OtherUtil.setReaderConfig(
      "isHideHeader",
      this.state.isHideHeader ? "no" : "yes"
    );
    this.state.isHideHeader
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
        {readerSettingList.map((item) => (
          <div className="single-control-switch-container">
            <span className="single-control-switch-title">
              <Trans>{item.title}</Trans>
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                switch (item.propName) {
                  case "isBold":
                    this.handleBold();
                    break;
                  case "isItalic":
                    this.handleItalic();
                    break;
                  case "isUnderline":
                    this.handleUnderline();
                    break;
                  case "isShadow":
                    this.handleShadow();
                    break;
                  case "isHideFooter":
                    this.handleFooter();
                    break;
                  case "isHideHeader":
                    this.handleHeader();
                    break;
                  case "isUseBackground":
                    this.handleChangeBackground();
                    break;
                  default:
                    break;
                }
              }}
              style={
                this.state[item.propName]
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  !this.state[item.propName]
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
        ))}
      </>
    );
  }
}

export default SettingSwitch;
