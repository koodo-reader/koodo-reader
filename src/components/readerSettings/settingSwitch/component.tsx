//右侧阅读选项面板
import React from "react";
import { SettingSwitchProps, SettingSwitchState } from "./interface";
import { Trans } from "react-i18next";
import TextToSpeech from "../../textToSpeech";
import OtherUtil from "../../../utils/otherUtil";
import {
  readerSettingList,
  htmlSettingList,
} from "../../../constants/settingList";
import { isElectron } from "react-device-detect";

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
      isInvert: OtherUtil.getReaderConfig("isInvert") === "yes",
      isUseBackground: OtherUtil.getReaderConfig("isUseBackground") === "yes",
      isHideFooter: OtherUtil.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: OtherUtil.getReaderConfig("isHideHeader") === "yes",
    };
  }
  handleRest = () => {
    this.props.renderFunc();
  };
  _handleRest = () => {
    if (isElectron) {
      this.props.handleMessage("Take effect at next startup");
      this.props.handleMessageBox(true);
    } else {
      window.location.reload();
    }
  };
  handleBold = () => {
    this.setState({ isBold: !this.state.isBold }, () => {
      OtherUtil.setReaderConfig("isBold", this.state.isBold ? "yes" : "no");
      setTimeout(() => {
        this.handleRest();
      }, 500);
    });
  };
  handleItalic = () => {
    this.setState({ isItalic: !this.state.isItalic }, () => {
      OtherUtil.setReaderConfig("isItalic", this.state.isItalic ? "yes" : "no");
      setTimeout(() => {
        this.handleRest();
      }, 500);
    });
  };
  handleShadow = () => {
    this.setState({ isShadow: !this.state.isShadow }, () => {
      OtherUtil.setReaderConfig("isShadow", this.state.isShadow ? "yes" : "no");
      setTimeout(() => {
        this.handleRest();
      }, 500);
    });
  };
  handleInvert = () => {
    this.setState({ isInvert: !this.state.isInvert }, () => {
      OtherUtil.setReaderConfig("isInvert", this.state.isInvert ? "yes" : "no");
      setTimeout(() => {
        this.handleRest();
      }, 500);
    });
  };
  handleUnderline = () => {
    this.setState({ isUnderline: !this.state.isUnderline }, () => {
      OtherUtil.setReaderConfig(
        "isUnderline",
        this.state.isUnderline ? "yes" : "no"
      );
      setTimeout(() => {
        this.handleRest();
      }, 500);
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
    setTimeout(() => {
      this._handleRest();
    }, 500);
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
      this._handleRest();
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
      this._handleRest();
    }, 500);
  };

  render() {
    return (
      <>
        {this.props.currentEpub.archived && <TextToSpeech />}
        {(this.props.currentEpub.rendition
          ? readerSettingList
          : htmlSettingList
        ).map((item) => (
          <div className="single-control-switch-container" key={item.title}>
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
                  case "isInvert":
                    this.handleInvert();
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
              style={this.state[item.propName] ? {} : { opacity: 0.6 }}
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
