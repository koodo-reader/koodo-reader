//左下角的图标外链
import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import { version } from "../../../../package.json";
import OtherUtil from "../../../utils/otherUtil";
import SyncUtil from "../../../utils/syncUtils/common";
import { isElectron } from "react-device-detect";
import {
  settingList,
  langList,
  searchList,
} from "../../../constants/settingList";
class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      language: OtherUtil.getReaderConfig("lang"),
      isTouch: OtherUtil.getReaderConfig("isTouch") === "yes",
      isRememberSize: OtherUtil.getReaderConfig("isRememberSize") === "yes",
      isOpenBook: OtherUtil.getReaderConfig("isOpenBook") === "yes",
      isExpandContent: OtherUtil.getReaderConfig("isExpandContent") === "yes",
      isDisableUpdate: OtherUtil.getReaderConfig("isDisableUpdate") === "yes",
      searchEngine: navigator.language === "zh-CN" ? "baidu" : "google",
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
        ["zh", "cht", "en", "ru"].indexOf(
          OtherUtil.getReaderConfig("lang") || "zh"
        )
      ].setAttribute("selected", "selected");
  }
  handleRest = (bool: boolean) => {
    bool
      ? this.props.handleMessage("Turn Off Successfully")
      : this.props.handleMessage("Turn On Successfully");
    this.props.handleMessageBox(true);
  };
  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    this.setState({ language: lng });
    OtherUtil.setReaderConfig("lang", lng);
  };
  changeSearch = (searchEngine: string) => {
    this.setState({ searchEngine });
    OtherUtil.setReaderConfig("searchEngine", searchEngine);
  };
  handleChangeTouch = () => {
    this.setState({ isTouch: !this.state.isTouch });
    OtherUtil.setReaderConfig("isTouch", this.state.isTouch ? "no" : "yes");
    this.handleRest(this.state.isTouch);
  };
  handleJump = (url: string) => {
    isElectron
      ? window.require("electron").shell.openExternal(url)
      : window.open(url);
  };

  handleExpandContent = () => {
    this.setState({ isExpandContent: !this.state.isExpandContent });
    OtherUtil.setReaderConfig(
      "isExpandContent",
      this.state.isExpandContent ? "no" : "yes"
    );
    this.handleRest(this.state.isExpandContent);
  };
  handleDisableUpdate = () => {
    this.setState({ isDisableUpdate: !this.state.isDisableUpdate });
    OtherUtil.setReaderConfig(
      "isDisableUpdate",
      this.state.isDisableUpdate ? "no" : "yes"
    );
    this.handleRest(this.state.isDisableUpdate);
  };

  handleChangeOpen = () => {
    this.setState({ isOpenBook: !this.state.isOpenBook });
    OtherUtil.setReaderConfig(
      "isOpenBook",
      this.state.isOpenBook ? "no" : "yes"
    );
    this.handleRest(this.state.isOpenBook);
  };
  handleWindowSize = () => {
    this.setState({ isRememberSize: !this.state.isRememberSize });
    OtherUtil.setReaderConfig(
      "isRememberSize",
      this.state.isRememberSize ? "no" : "yes"
    );
    this.handleRest(this.state.isRememberSize);
  };
  handleChangeLocation = async () => {
    const { dialog } = window.require("electron").remote;
    var path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    const { ipcRenderer } = window.require("electron");
    path.filePaths[0] &&
      SyncUtil.changeLocation(
        localStorage.getItem("storageLocation")
          ? localStorage.getItem("storageLocation")
          : ipcRenderer.sendSync("storage-location", "ping"),
        path.filePaths[0],
        this.props.handleMessage,
        this.props.handleMessageBox
      );
    localStorage.setItem("storageLocation", path.filePaths[0]);
    document.getElementsByClassName(
      "setting-dialog-location-title"
    )[0].innerHTML =
      path.filePaths[0] ||
      localStorage.getItem("storageLocation") ||
      ipcRenderer.sendSync("storage-location", "ping");
  };
  render() {
    return (
      <div className="setting-dialog-container">
        <p className="setting-dialog-title">
          <Trans>Setting</Trans>
        </p>
        <p className="setting-subtitle">
          <Trans>Version</Trans>
          {version}
        </p>
        <div
          className="setting-close-container"
          onClick={() => {
            this.props.handleSetting(false);
          }}
        >
          <span className="icon-close setting-close"></span>
        </div>

        <div className="setting-dialog-info">
          {settingList.map((item, index) => {
            return (
              <div
                className="setting-dialog-new-title"
                key={item.title}
                style={
                  item.isElectron ? (isElectron ? {} : { display: "none" }) : {}
                }
              >
                <Trans>{item.title}</Trans>
                <span
                  className="single-control-switch"
                  onClick={() => {
                    switch (index) {
                      case 0:
                        this.handleChangeTouch();
                        break;
                      case 1:
                        this.handleChangeOpen();
                        break;
                      case 2:
                        this.handleWindowSize();
                        break;
                      case 3:
                        this.handleExpandContent();
                        break;
                      case 4:
                        this.handleDisableUpdate();
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
                      this.state[item.propName]
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
            );
          })}

          {isElectron && (
            <>
              <div className="setting-dialog-new-title">
                <Trans>Change storage location</Trans>

                <span
                  className="change-location-button"
                  onClick={() => {
                    this.handleChangeLocation();
                  }}
                >
                  <Trans>Change location</Trans>
                </span>
              </div>
              <div className="setting-dialog-location-title">
                {localStorage.getItem("storageLocation")
                  ? localStorage.getItem("storageLocation")
                  : window
                      .require("electron")
                      .ipcRenderer.sendSync("storage-location", "ping")}
              </div>
            </>
          )}

          <div className="setting-dialog-new-title">
            <Trans>Language</Trans>
            <select
              name=""
              className="lang-setting-dropdown"
              onChange={(event) => {
                this.changeLanguage(event.target.value);
              }}
            >
              {langList.map((item) => (
                <option value={item.value} className="lang-setting-option">
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="setting-dialog-new-title">
            <Trans>Default search engine</Trans>
            <select
              name=""
              className="lang-setting-dropdown"
              onChange={(event) => {
                this.changeSearch(event.target.value);
              }}
            >
              {searchList.map((item) => (
                <option value={item.value} className="lang-setting-option">
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }
}

export default SettingDialog;
