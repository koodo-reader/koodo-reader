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
      isHidePageButton: OtherUtil.getReaderConfig("isHidePageButton") === "yes",
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

  _handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any, () => {
      OtherUtil.setReaderConfig(
        stateName,
        this.state[stateName] ? "yes" : "no"
      );
      setTimeout(() => {
        this.handleRest();
      }, 500);
    });
  };

  handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    OtherUtil.setReaderConfig(stateName, this.state[stateName] ? "no" : "yes");

    this.state[stateName]
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
                    this._handleChange("isBold");
                    break;
                  case "isItalic":
                    this._handleChange("isItalic");
                    break;
                  case "isUnderline":
                    this._handleChange("isUnderline");
                    break;
                  case "isShadow":
                    this._handleChange("isShadow");
                    break;
                  case "isInvert":
                    this._handleChange("isInvert");
                    break;
                  case "isHideFooter":
                    this.handleChange("isHideFooter");
                    break;
                  case "isHideHeader":
                    this.handleChange("isHideHeader");
                    break;
                  case "isUseBackground":
                    this.handleChange("isUseBackground");
                    break;
                  case "isHidePageButton":
                    this.handleChange("isHidePageButton");
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
