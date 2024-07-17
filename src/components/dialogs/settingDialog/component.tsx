import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import packageInfo from "../../../../package.json";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { changePath } from "../../../utils/syncUtils/common";
import { isElectron } from "react-device-detect";
import { dropdownList } from "../../../constants/dropdownList";

import { restore } from "../../../utils/syncUtils/restoreUtil";
import {
  generalSettingList,
  appearanceSettingList,
  readingSettingList,
  langList,
  searchList,
  skinList,
} from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import { openExternalUrl } from "../../../utils/serviceUtils/urlUtil";
import ManagerUtil from "../../../utils/fileUtils/managerUtil";
import PluginList from "../../../utils/readUtils/pluginList";
declare var window: any;
class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      currentTab: "general",
      pluginList: PluginList.getAllPlugins(),
      isTouch: StorageUtil.getReaderConfig("isTouch") === "yes",
      isImportPath: StorageUtil.getReaderConfig("isImportPath") === "yes",
      isMergeWord: StorageUtil.getReaderConfig("isMergeWord") === "yes",
      isPreventTrigger:
        StorageUtil.getReaderConfig("isPreventTrigger") === "yes",
      isAutoFullscreen:
        StorageUtil.getReaderConfig("isAutoFullscreen") === "yes",
      isPreventAdd: StorageUtil.getReaderConfig("isPreventAdd") === "yes",
      isLemmatizeWord: StorageUtil.getReaderConfig("isLemmatizeWord") === "yes",
      isOpenBook: StorageUtil.getReaderConfig("isOpenBook") === "yes",
      isExpandContent: StorageUtil.getReaderConfig("isExpandContent") === "yes",
      isDisablePopup: StorageUtil.getReaderConfig("isDisablePopup") === "yes",
      isDisableTrashBin:
        StorageUtil.getReaderConfig("isDisableTrashBin") === "yes",
      isDeleteShelfBook:
        StorageUtil.getReaderConfig("isDeleteShelfBook") === "yes",
      isHideShelfBook: StorageUtil.getReaderConfig("isHideShelfBook") === "yes",
      isPreventSleep: StorageUtil.getReaderConfig("isPreventSleep") === "yes",
      isOpenInMain: StorageUtil.getReaderConfig("isOpenInMain") === "yes",
      isDisableUpdate: StorageUtil.getReaderConfig("isDisableUpdate") === "yes",
      isPrecacheBook: StorageUtil.getReaderConfig("isPrecacheBook") === "yes",
      appSkin: StorageUtil.getReaderConfig("appSkin"),
      isUseBuiltIn: StorageUtil.getReaderConfig("isUseBuiltIn") === "yes",
      isDisableCrop: StorageUtil.getReaderConfig("isDisableCrop") === "yes",
      isDisablePDFCover:
        StorageUtil.getReaderConfig("isDisablePDFCover") === "yes",
      currentThemeIndex: window._.findLastIndex(themeList, {
        name: StorageUtil.getReaderConfig("themeColor"),
      }),
      storageLocation: isElectron
        ? localStorage.getItem("storageLocation")
          ? localStorage.getItem("storageLocation")
          : window
              .require("electron")
              .ipcRenderer.sendSync("storage-location", "ping")
        : "",
    };
  }
  componentDidMount() {
    StorageUtil.getReaderConfig("systemFont") &&
      document
        .getElementsByClassName("lang-setting-dropdown")[0]
        ?.children[
          dropdownList[0].option.indexOf(
            StorageUtil.getReaderConfig("systemFont")
          )
        ]?.setAttribute("selected", "selected");
    document
      .getElementsByClassName("lang-setting-dropdown")[1]
      ?.children[
        langList
          .map((item) => item.value)
          .indexOf(StorageUtil.getReaderConfig("lang") || "en")
      ]?.setAttribute("selected", "selected");
    document.getElementsByClassName("lang-setting-dropdown")[2]?.children[
      window._.findLastIndex(searchList, {
        value:
          StorageUtil.getReaderConfig("searchEngine") ||
          (navigator.language === "zh-CN" ? "baidu" : "google"),
      })
    ]?.setAttribute("selected", "selected");
    document.getElementsByClassName("lang-setting-dropdown")[3]?.children[
      window._.findLastIndex(skinList, {
        value: StorageUtil.getReaderConfig("appSkin") || "system",
      })
    ]?.setAttribute("selected", "selected");
  }
  handleRest = (bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };
  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    StorageUtil.setReaderConfig("lang", lng);
  };
  changeSearch = (searchEngine: string) => {
    StorageUtil.setReaderConfig("searchEngine", searchEngine);
  };
  changeSkin = (skin: string) => {
    StorageUtil.setReaderConfig("appSkin", skin);

    if (
      skin === "night" ||
      (StorageUtil.getReaderConfig("appSkin") === "system" &&
        StorageUtil.getReaderConfig("isOSNight") === "yes")
    ) {
      StorageUtil.setReaderConfig("backgroundColor", "rgba(44,47,49,1)");
      StorageUtil.setReaderConfig("textColor", "rgba(255,255,255,1)");
    } else if (
      skin === "light" ||
      (StorageUtil.getReaderConfig("appSkin") === "system" &&
        StorageUtil.getReaderConfig("isOSNight") !== "yes")
    ) {
      StorageUtil.setReaderConfig("backgroundColor", "rgba(255,255,255,1)");
      StorageUtil.setReaderConfig("textColor", "rgba(0,0,0,1)");
    }

    ManagerUtil.reloadManager();
  };
  changeFont = (font: string) => {
    let body = document.getElementsByTagName("body")[0];
    body?.setAttribute("style", "font-family:" + font + "!important");
    StorageUtil.setReaderConfig("systemFont", font);
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    StorageUtil.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
  };
  syncFromLocation = async () => {
    const fs = window.require("fs");
    const path = window.require("path");
    const { zip } = window.require("zip-a-folder");
    let storageLocation = localStorage.getItem("storageLocation")
      ? localStorage.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
    let sourcePath = path.join(storageLocation, "config");
    let outPath = path.join(storageLocation, "config.zip");
    await zip(sourcePath, outPath);

    var data = fs.readFileSync(outPath);

    let blobTemp = new Blob([data], { type: "application/epub+zip" });
    let fileTemp = new File([blobTemp], "config.zip", {
      lastModified: new Date().getTime(),
      type: blobTemp.type,
    });

    let result = await restore(fileTemp, true);
    if (result) {
      toast.success(this.props.t("Change successful"));
    } else {
      toast.error(this.props.t("Change failed"));
    }
  };
  handleChangeLocation = async () => {
    const { ipcRenderer } = window.require("electron");
    const path = await ipcRenderer.invoke("change-path");
    if (!path.filePaths[0]) {
      return;
    }
    let result = await changePath(
      localStorage.getItem("storageLocation")
        ? localStorage.getItem("storageLocation")
        : ipcRenderer.sendSync("storage-location", "ping"),
      path.filePaths[0]
    );
    if (result === 1) {
      this.syncFromLocation();
    } else if (result === 2) {
      this.props.handleFetchBooks();
      toast.success(this.props.t("Change successful"));
    } else {
      toast.error(this.props.t("Change failed"));
    }
    localStorage.setItem("storageLocation", path.filePaths[0]);
    this.setState({ storageLocation: path.filePaths[0] });
    document.getElementsByClassName(
      "setting-dialog-location-title"
    )[0].innerHTML =
      path.filePaths[0] ||
      localStorage.getItem("storageLocation") ||
      ipcRenderer.sendSync("storage-location", "ping");
  };
  handleChangeTab = (currentTab: string) => {
    this.setState({ currentTab });
  };
  handleTheme = (name: string, index: number) => {
    this.setState({ currentThemeIndex: index });
    StorageUtil.setReaderConfig("themeColor", name);
    ManagerUtil.reloadManager();
  };
  handleMergeWord = () => {
    if (this.state.isOpenInMain && !this.state.isMergeWord) {
      toast(this.props.t("Please turn off open books in the main window"));
      return;
    }
    this.handleSetting("isMergeWord");
    this.handleMoyu();
  };
  handleMoyu = () => {
    if (StorageUtil.getReaderConfig("isMergeWord") === "yes") {
      StorageUtil.setReaderConfig("isHideBackground", "yes");
    }
  };
  handleOpenInMain = () => {
    if (this.state.isMergeWord && !this.state.isOpenInMain) {
      toast(this.props.t("Please turn off merge with word first"));
      return;
    }
    this.handleSetting("isOpenInMain");
  };
  render() {
    return (
      <div className="setting-dialog-container">
        <p className="setting-dialog-title">
          <Trans>Setting</Trans>
        </p>
        <p className="setting-subtitle">
          <Trans>Version</Trans>
          {packageInfo.version}
          &nbsp;&nbsp;
          <Trans>
            {StorageUtil.getReaderConfig("appInfo") === "new"
              ? "New version available"
              : StorageUtil.getReaderConfig("appInfo") === "stable"
              ? "Latest stable version"
              : StorageUtil.getReaderConfig("appInfo") === "dev"
              ? "Developer version"
              : ""}
          </Trans>
          <div
            className="navigation-navigation"
            style={{ position: "unset", marginTop: "5px" }}
          >
            <span
              className="book-bookmark-title"
              onClick={() => {
                this.handleChangeTab("general");
              }}
              style={
                this.state.currentTab === "general"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
            >
              <Trans>General</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.state.currentTab === "reading"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.handleChangeTab("reading");
              }}
            >
              <Trans>Reading</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.state.currentTab === "appearance"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.handleChangeTab("appearance");
              }}
            >
              <Trans>Appearance</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.state.currentTab === "plugins"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.handleChangeTab("plugins");
              }}
            >
              <Trans>Plugins</Trans>
            </span>
          </div>
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
          {this.state.currentTab === "general" ? (
            <>
              {generalSettingList.map((item, index) => {
                return (
                  <div
                    style={
                      item.isElectron
                        ? isElectron
                          ? {}
                          : { display: "none" }
                        : {}
                    }
                    key={item.propName}
                  >
                    <div className="setting-dialog-new-title" key={item.title}>
                      <span style={{ width: "250px" }}>
                        <Trans>{item.title}</Trans>
                      </span>

                      <span
                        className="single-control-switch"
                        onClick={() => {
                          switch (item.propName) {
                            case "isMergeWord":
                              this.handleMergeWord();
                              break;
                            case "isOpenInMain":
                              this.handleOpenInMain();
                              break;
                            default:
                              this.handleSetting(item.propName);
                              break;
                          }
                        }}
                        style={
                          this.state[item.propName] ? {} : { opacity: 0.6 }
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
                    <p className="setting-option-subtitle">
                      <Trans>{item.desc}</Trans>
                    </p>
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
                      <Trans>Select</Trans>
                    </span>
                  </div>
                  <div className="setting-dialog-location-title">
                    {this.state.storageLocation}
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
                    <option
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                    >
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
                    <option
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                    >
                      {this.props.t(item.label)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : this.state.currentTab === "reading" ? (
            <>
              {readingSettingList.map((item, index) => {
                return (
                  <div
                    style={
                      item.isElectron
                        ? isElectron
                          ? {}
                          : { display: "none" }
                        : {}
                    }
                    key={item.propName}
                  >
                    <div className="setting-dialog-new-title" key={item.title}>
                      <span style={{ width: "250px" }}>
                        <Trans>{item.title}</Trans>
                      </span>

                      <span
                        className="single-control-switch"
                        onClick={() => {
                          switch (item.propName) {
                            case "isMergeWord":
                              this.handleMergeWord();
                              break;
                            case "isOpenInMain":
                              this.handleOpenInMain();
                              break;
                            default:
                              this.handleSetting(item.propName);
                              break;
                          }
                        }}
                        style={
                          this.state[item.propName] ? {} : { opacity: 0.6 }
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
                    <p className="setting-option-subtitle">
                      <Trans>{item.desc}</Trans>
                    </p>
                  </div>
                );
              })}
            </>
          ) : this.state.currentTab === "appearance" ? (
            <>
              {appearanceSettingList.map((item, index) => {
                return (
                  <div
                    style={
                      item.isElectron
                        ? isElectron
                          ? {}
                          : { display: "none" }
                        : {}
                    }
                    key={item.propName}
                  >
                    <div className="setting-dialog-new-title" key={item.title}>
                      <span style={{ width: "250px" }}>
                        <Trans>{item.title}</Trans>
                      </span>

                      <span
                        className="single-control-switch"
                        onClick={() => {
                          switch (item.propName) {
                            case "isMergeWord":
                              this.handleMergeWord();
                              break;
                            case "isOpenInMain":
                              this.handleOpenInMain();
                              break;
                            default:
                              this.handleSetting(item.propName);
                              break;
                          }
                        }}
                        style={
                          this.state[item.propName] ? {} : { opacity: 0.6 }
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
                    <p className="setting-option-subtitle">
                      <Trans>{item.desc}</Trans>
                    </p>
                  </div>
                );
              })}
              <div className="setting-dialog-new-title">
                <Trans>Theme color</Trans>
                <ul className="theme-setting-container">
                  {themeList.map((item, index) => (
                    <li
                      className={
                        index === this.state.currentThemeIndex
                          ? "active-color theme-setting-item"
                          : "theme-setting-item"
                      }
                      key={item.name}
                      onClick={() => {
                        this.handleTheme(item.name, index);
                      }}
                      style={{ backgroundColor: item.color }}
                    ></li>
                  ))}
                </ul>
              </div>
              <div className="setting-dialog-new-title">
                <Trans>Appearance</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={(event) => {
                    this.changeSkin(event.target.value);
                  }}
                >
                  {skinList.map((item) => (
                    <option
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                    >
                      {this.props.t(item.label)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-dialog-new-title">
                <Trans>System font</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={(event) => {
                    this.changeFont(event.target.value);
                  }}
                >
                  {dropdownList[0].option.map((item) => (
                    <option
                      value={item}
                      key={item}
                      className="lang-setting-option"
                    >
                      {this.props.t(item)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              {this.state.pluginList.length > 0 ? (
                this.state.pluginList.map((item, index) => {
                  return (
                    <div className="setting-dialog-new-title">
                      <span>
                        <span
                          className={`icon-${item.icon} setting-plugin-icon`}
                        ></span>
                        <span className="setting-plugin-name">
                          {item.displayName}
                        </span>
                      </span>

                      <span
                        className="change-location-button"
                        onClick={() => {
                          PluginList.deletePluginById(item.identifier);
                          this.setState({
                            pluginList: PluginList.getAllPlugins(),
                          });
                          toast.success(this.props.t("Deletion successful"));
                        }}
                      >
                        <Trans>Delete</Trans>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="navigation-panel-empty-bookmark">
                  <Trans>Empty</Trans>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
}

export default SettingDialog;
