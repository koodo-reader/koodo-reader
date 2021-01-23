//左下角的图标外链
import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../i18n";
import { updateLog } from "../../constants/updateLog";
import OtherUtil from "../../utils/otherUtil";
const isElectron = require("is-electron");

class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      language: OtherUtil.getReaderConfig("lang"),
      isTouch: OtherUtil.getReaderConfig("isTouch") === "yes",
      isOpenBook: OtherUtil.getReaderConfig("isOpenBook") === "yes",
      isExpandContent: OtherUtil.getReaderConfig("isExpandContent") === "yes",
    };
  }
  componentDidMount() {
    const lng = OtherUtil.getReaderConfig("lang");
    if (lng) {
      this.setState({
        language: lng,
      });
    }
    document
      .querySelector(".lang-setting-dropdown")
      ?.children[
        ["zh", "cht", "en"].indexOf(OtherUtil.getReaderConfig("lang") || "zh")
      ].setAttribute("selected", "selected");
  }

  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    this.setState({ language: lng });
    OtherUtil.setReaderConfig("lang", lng);
  };
  handleChangeTouch = () => {
    this.setState({ isTouch: !this.state.isTouch });
    OtherUtil.setReaderConfig("isTouch", this.state.isTouch ? "no" : "yes");
    this.state.isTouch
      ? this.props.handleMessage("Turn Off Successfully")
      : this.props.handleMessage("Turn On Successfully");
    this.props.handleMessageBox(true);
  };
  handleJump = (url: string) => {
    isElectron()
      ? window.require("electron").shell.openExternal(url)
      : window.open(url);
  };

  handleExpandContent = () => {
    this.setState({ isExpandContent: !this.state.isExpandContent });
    OtherUtil.setReaderConfig(
      "isExpandContent",
      this.state.isExpandContent ? "no" : "yes"
    );
    this.state.isExpandContent
      ? this.props.handleMessage("Turn Off Successfully")
      : this.props.handleMessage("Turn On Successfully");
    this.props.handleMessageBox(true);
  };
  handleChangeOpen = () => {
    this.setState({ isOpenBook: !this.state.isOpenBook });
    OtherUtil.setReaderConfig(
      "isOpenBook",
      this.state.isOpenBook ? "no" : "yes"
    );
    this.state.isOpenBook
      ? this.props.handleMessage("Turn Off Successfully")
      : this.props.handleMessage("Turn On Successfully");
    this.props.handleMessageBox(true);
  };

  render() {
    return (
      <div className="setting-dialog-container">
        <p className="setting-dialog-title">
          <Trans>Setting</Trans>
        </p>
        <p className="setting-subtitle">
          <Trans>Version</Trans>
          {updateLog.version}
        </p>
        <p className="setting-subtitle">
          <Trans>Date</Trans>
          {updateLog.date}
        </p>
        <div className="setting-close-container">
          <span
            className="icon-close setting-close"
            onClick={() => {
              this.props.handleSetting(false);
            }}
          ></span>
        </div>

        <div className="setting-dialog-info">
          <div className="setting-dialog-new-title">
            {this.state.isTouch ? (
              <Trans>Turn off touch screen mode</Trans>
            ) : (
              <Trans>Turn on touch screen mode</Trans>
            )}

            <span
              className="single-control-switch"
              onClick={() => {
                this.handleChangeTouch();
              }}
              style={
                this.state.isTouch
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  this.state.isTouch
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
          <div className="setting-dialog-new-title">
            <Trans>Auto open latest book</Trans>
            <span
              className="single-control-switch"
              onClick={() => {
                this.handleChangeOpen();
              }}
              style={
                this.state.isOpenBook
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  this.state.isOpenBook
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

          <div className="setting-dialog-new-title">
            <Trans>Default expand all content</Trans>
            <span
              className="single-control-switch"
              onClick={() => {
                this.handleExpandContent();
              }}
              style={
                this.state.isExpandContent
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  this.state.isExpandContent
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

          <div className="setting-dialog-new-title">
            <Trans>语言 / Language</Trans>
            <select
              name=""
              className="lang-setting-dropdown"
              onChange={(event) => {
                this.changeLanguage(event.target.value);
              }}
            >
              <option value="zh" className="lang-setting-option">
                简体中文
              </option>
              <option value="cht" className="lang-setting-option">
                繁體中文
              </option>
              <option value="en" className="lang-setting-option">
                English
              </option>
            </select>
          </div>
          <div className="about-this-project">
            <div
              className="setting-dialog-subtitle"
              onClick={() => {
                this.handleJump("https://github.com/troyeguo/koodo-reader");
              }}
            >
              <Trans>Project link</Trans>
            </div>
            <div
              className="setting-dialog-subtitle"
              onClick={() => {
                this.handleJump("https://koodo.960960.xyz/");
              }}
            >
              <Trans>Official website</Trans>
            </div>
            <div
              className="setting-dialog-subtitle"
              onClick={() => {
                this.handleJump("https://960960.xyz");
              }}
            >
              <Trans>About author</Trans>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SettingDialog;
