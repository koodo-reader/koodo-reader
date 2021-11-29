import React from "react";
import { SettingSwitchProps, SettingSwitchState } from "./interface";
import { Trans } from "react-i18next";
import TextToSpeech from "../../textToSpeech";
import StorageUtil from "../../../utils/storageUtil";
import { readerSettingList } from "../../../constants/settingList";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
class SettingSwitch extends React.Component<
  SettingSwitchProps,
  SettingSwitchState
> {
  constructor(props: SettingSwitchProps) {
    super(props);
    this.state = {
      isBold: StorageUtil.getReaderConfig("isBold") === "yes",
      isIndent: StorageUtil.getReaderConfig("isIndent") === "yes",
      isSliding: StorageUtil.getReaderConfig("isSliding") === "yes",
      isUnderline: StorageUtil.getReaderConfig("isUnderline") === "yes",
      isShadow: StorageUtil.getReaderConfig("isShadow") === "yes",
      isItalic: StorageUtil.getReaderConfig("isItalic") === "yes",
      isInvert: StorageUtil.getReaderConfig("isInvert") === "yes",
      isHideBackground:
        StorageUtil.getReaderConfig("isHideBackground") === "yes",
      isHideFooter: StorageUtil.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: StorageUtil.getReaderConfig("isHideHeader") === "yes",
      isHidePageButton:
        StorageUtil.getReaderConfig("isHidePageButton") === "yes",
      isHideMenuButton:
        StorageUtil.getReaderConfig("isHideMenuButton") === "yes",
    };
  }

  _handleRest = () => {
    if (isElectron) {
      toast(this.props.t("Take effect at next startup"));
    } else {
      window.location.reload();
    }
  };

  _handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any, () => {
      StorageUtil.setReaderConfig(
        stateName,
        this.state[stateName] ? "yes" : "no"
      );
      toast(this.props.t("Change Successfully"));
      setTimeout(() => {
        this.props.renderFunc();
      }, 500);
    });
  };

  handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    StorageUtil.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );

    toast(this.props.t("Change Successfully"));
    setTimeout(() => {
      this._handleRest();
    }, 500);
  };
  render() {
    return (
      <>
        {Object.keys(this.props.currentEpub).length !== 0 && <TextToSpeech />}
        {readerSettingList.map((item) => (
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
                  case "isIndent":
                    this._handleChange("isIndent");
                    break;
                  case "isSliding":
                    this._handleChange("isSliding");
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
                  case "isHideBackground":
                    this.handleChange("isHideBackground");
                    break;
                  case "isHidePageButton":
                    this.handleChange("isHidePageButton");
                    break;
                  case "isHideMenuButton":
                    this.handleChange("isHideMenuButton");
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
