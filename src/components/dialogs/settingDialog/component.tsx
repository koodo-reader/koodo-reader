import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import packageInfo from "../../../../package.json";
import { changePath } from "../../../utils/file/common";
import { isElectron } from "react-device-detect";
import { dropdownList } from "../../../constants/dropdownList";
import _ from "underscore";
import { restoreFromConfigJson } from "../../../utils/file/restore";
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
import {
  checkPlugin,
  loadFontData,
  openExternalUrl,
} from "../../../utils/common";
import { getStorageLocation, reloadManager } from "../../../utils/common";
import DatabaseService from "../../../utils/storage/databaseService";
import { driveInputConfig, driveList } from "../../../constants/driveList";
import {
  ConfigService,
  LoginHelper,
  SyncUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  getThirdpartyRequest,
  onSyncCallback,
} from "../../../utils/request/thirdparty";
import TokenService from "../../../utils/storage/tokenService";
import { loginList } from "../../../constants/loginList";
import { getUserRequest, loginRegister } from "../../../utils/request/user";
import { handleExitApp } from "../../../utils/request/common";
declare var window: any;
class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      isImportPath: ConfigService.getReaderConfig("isImportPath") === "yes",
      isMergeWord: ConfigService.getReaderConfig("isMergeWord") === "yes",
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isAutoFullscreen:
        ConfigService.getReaderConfig("isAutoFullscreen") === "yes",
      isPreventAdd: ConfigService.getReaderConfig("isPreventAdd") === "yes",
      isLemmatizeWord:
        ConfigService.getReaderConfig("isLemmatizeWord") === "yes",
      isOpenBook: ConfigService.getReaderConfig("isOpenBook") === "yes",
      isExpandContent:
        ConfigService.getReaderConfig("isExpandContent") === "yes",
      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isDisableTrashBin:
        ConfigService.getReaderConfig("isDisableTrashBin") === "yes",
      isDeleteShelfBook:
        ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      isPreventSleep: ConfigService.getReaderConfig("isPreventSleep") === "yes",
      isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
      isDisableUpdate:
        ConfigService.getReaderConfig("isDisableUpdate") === "yes",
      isPrecacheBook: ConfigService.getReaderConfig("isPrecacheBook") === "yes",
      appSkin: ConfigService.getReaderConfig("appSkin"),
      isUseBuiltIn: ConfigService.getReaderConfig("isUseBuiltIn") === "yes",
      isDisableCrop: ConfigService.getReaderConfig("isDisableCrop") === "yes",
      isDisablePDFCover:
        ConfigService.getReaderConfig("isDisablePDFCover") === "yes",
      currentThemeIndex: _.findLastIndex(themeList, {
        name: ConfigService.getReaderConfig("themeColor"),
      }),
      storageLocation: getStorageLocation() || "",
      isAddNew: false,
      settingLogin: "",
      driveConfig: {},
      loginConfig: {},
    };
  }
  componentDidMount(): void {
    this.props.handleFetchPlugins();
    this.loadFont();
    this.props.handleFetchDataSourceList();
    this.props.handleFetchDefaultSyncOption();
    if (this.props.isAuthed) {
      this.props.handleFetchLoginOptionList();
    }
  }
  loadFont = () => {
    if (dropdownList[0].option.length <= 2) {
      loadFontData().then((result) => {
        dropdownList[0].option = dropdownList[0].option.concat(result);
      });
    }
  };
  handleRest = (bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };
  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    ConfigService.setReaderConfig("lang", lng);
  };
  changeSearch = (searchEngine: string) => {
    ConfigService.setReaderConfig("searchEngine", searchEngine);
  };
  changeSkin = (skin: string) => {
    ConfigService.setReaderConfig("appSkin", skin);

    if (
      skin === "night" ||
      (ConfigService.getReaderConfig("appSkin") === "system" &&
        ConfigService.getReaderConfig("isOSNight") === "yes")
    ) {
      ConfigService.setReaderConfig("backgroundColor", "rgba(44,47,49,1)");
      ConfigService.setReaderConfig("textColor", "rgba(255,255,255,1)");
    } else if (
      skin === "light" ||
      (ConfigService.getReaderConfig("appSkin") === "system" &&
        ConfigService.getReaderConfig("isOSNight") !== "yes")
    ) {
      ConfigService.setReaderConfig("backgroundColor", "rgba(255,255,255,1)");
      ConfigService.setReaderConfig("textColor", "rgba(0,0,0,1)");
    }

    reloadManager();
  };
  changeFont = (font: string) => {
    if (font === "Load local fonts") {
      this.loadFont();
      return;
    }
    let body = document.getElementsByTagName("body")[0];
    body?.setAttribute("style", "font-family:" + font + "!important");
    ConfigService.setReaderConfig("systemFont", font);
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
  };
  syncFromLocation = async () => {
    let result = await restoreFromConfigJson();
    if (result) {
      toast.success(this.props.t("Change successful"));
    } else {
      toast.error(this.props.t("Change failed"));
    }
  };
  handleChangeLocation = async () => {
    const { ipcRenderer } = window.require("electron");
    const newPath = await ipcRenderer.invoke("select-path");
    if (!newPath) {
      return;
    }
    let isSuccess = await changePath(newPath);
    if (!isSuccess) {
      toast.error(this.props.t("Change failed"));
      return;
    }
    localStorage.setItem("storageLocation", newPath);
    this.setState({ storageLocation: newPath });
    document.getElementsByClassName(
      "setting-dialog-location-title"
    )[0].innerHTML =
      newPath ||
      localStorage.getItem("storageLocation") ||
      ipcRenderer.sendSync("storage-location", "ping");
    toast.success(this.props.t("Change successful"));
  };
  handleResetReaderPosition = () => {
    window
      .require("electron")
      .ipcRenderer.invoke("reset-reader-position", "ping");
    toast.success(this.props.t("Reset successful"));
  };
  handleTheme = (name: string, index: number) => {
    this.setState({ currentThemeIndex: index });
    ConfigService.setReaderConfig("themeColor", name);
    reloadManager();
  };
  handleMergeWord = () => {
    if (this.state.isOpenInMain && !this.state.isMergeWord) {
      toast(this.props.t("Please turn off open books in the main window"));
      return;
    }
    if (this.state.isAutoFullscreen && !this.state.isMergeWord) {
      toast(this.props.t("Please turn off auto open book in full screen"));
      return;
    }
    this.handleSetting("isMergeWord");
    if (ConfigService.getReaderConfig("isMergeWord") === "yes") {
      ConfigService.setReaderConfig("isHideBackground", "yes");
    }
  };
  handleOpenInMain = () => {
    if (this.state.isMergeWord && !this.state.isOpenInMain) {
      toast(this.props.t("Please turn off merge with word first"));
      return;
    }
    this.handleSetting("isOpenInMain");
  };
  handleAddDataSource = (event: any) => {
    if (!event.target.value) {
      return;
    }
    if (
      !driveList
        .find((item) => item.value === event.target.value)
        ?.support.includes("browser") &&
      !isElectron
    ) {
      toast(
        this.props.t(
          "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
        )
      );
      return;
    }
    if (
      driveList.find((item) => item.value === event.target.value)?.isPro &&
      !this.props.isAuthed
    ) {
      toast(this.props.t("This feature is not available in the free version"));
      return;
    }
    this.props.handleSettingDrive(event.target.value);
  };
  handleDeleteDataSource = async (event: any) => {
    if (!event.target.value) {
      return;
    }
    if (event.target.value === this.props.defaultSyncOption) {
      toast.error(this.props.t("Default sync option cannot be removed"));
      return;
    }
    await TokenService.setToken(event.target.value + "_token", "");
    ConfigService.deleteListConfig(event.target.value, "dataSourceList");
    this.props.handleFetchDataSourceList();
    toast.success(this.props.t("Deletion successful"));
  };
  handleSetDefaultSyncOption = (event: any) => {
    if (!event.target.value) {
      return;
    }
    localStorage.setItem("defaultSyncOption", event.target.value);
    this.props.handleFetchDefaultSyncOption();
    toast.success(this.props.t("Change successful"));
  };
  handleAddLoginOption = (event: any) => {
    if (!event.target.value) {
      return;
    }
    this.setState({ settingLogin: event.target.value });
  };
  handleDeleteLoginOption = async (event: any) => {
    if (!event.target.value) {
      return;
    }
    if (this.props.loginOptionList.length === 1) {
      toast.error(this.props.t("At least one login option should be kept"));
      return;
    }
    toast.loading(this.props.t("Removing..."));
    let userRequest = await getUserRequest();
    let response = await userRequest.removeLogin({
      provider: event.target.value,
    });
    console.log(response.code);
    if (response.code === 200) {
      toast.success(this.props.t("Removal successful"));
      this.props.handleFetchLoginOptionList();
      toast.success(this.props.t("Deletion successful"));
    } else if (response.code === 401) {
      handleExitApp();
      return;
    } else {
      toast.error(this.props.t("Removal failed, error code: ") + response.code);
    }
  };
  handleCancelLoginOption = async () => {
    this.setState({ settingLogin: "" });
  };
  handleConfirmLoginOption = async () => {
    this.props.handleLoadingDialog(true);
    let resCode = await loginRegister(
      this.state.settingLogin,
      this.state.loginConfig.token
    );
    if (resCode === 200) {
      this.props.handleLoadingDialog(false);
      toast.success("登录成功");
      this.props.handleFetchAuthed();
      this.props.handleFetchLoginOptionList();
      this.setState({ settingLogin: "" });
      this.props.handleSetting(false);
    }
  };
  handleCancelDrive = () => {
    this.props.handleSettingDrive("");
  };
  handleConfirmDrive = async () => {
    if (
      this.props.settingDrive === "webdav" ||
      this.props.settingDrive === "ftp" ||
      this.props.settingDrive === "sftp" ||
      this.props.settingDrive === "s3compatible"
    ) {
      ConfigService.setReaderConfig(
        `${this.props.settingDrive}_token`,
        JSON.stringify(this.state.driveConfig)
      );
    } else {
      await onSyncCallback(
        this.props.settingDrive,
        this.state.driveConfig.token
      );
    }
    if (!this.props.defaultSyncOption) {
      localStorage.setItem("defaultSyncOption", this.props.settingDrive);
      this.props.handleFetchDefaultSyncOption();
    }
    this.props.handleFetchDataSourceList();

    this.props.handleSettingDrive("");
  };
  render() {
    return (
      <div className="setting-dialog-container">
        <div className="setting-dialog-title">
          <Trans>Setting</Trans>
        </div>
        <div className="setting-subtitle">
          <Trans>Version</Trans>
          {packageInfo.version}
          &nbsp;&nbsp;
          <Trans>
            {ConfigService.getReaderConfig("appInfo") === "new"
              ? "New version available"
              : ConfigService.getReaderConfig("appInfo") === "stable"
              ? "Latest stable version"
              : ConfigService.getReaderConfig("appInfo") === "dev"
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
                this.props.handleSettingMode("general");
              }}
              style={
                this.props.settingMode === "general"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
            >
              <Trans>General</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.props.settingMode === "reading"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.props.handleSettingMode("reading");
              }}
            >
              <Trans>Reading</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.props.settingMode === "appearance"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.props.handleSettingMode("appearance");
              }}
            >
              <Trans>Appearance</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.props.settingMode === "sync"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.props.handleSettingMode("sync");
              }}
            >
              <Trans>Sync and backup</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.props.settingMode === "account"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.props.handleSettingMode("account");
              }}
            >
              <Trans>Account</Trans>
            </span>
            <span
              className="book-bookmark-title"
              style={
                this.props.settingMode === "plugins"
                  ? { fontWeight: "bold", borderBottom: "2px solid" }
                  : { opacity: 0.5 }
              }
              onClick={() => {
                this.props.handleSettingMode("plugins");
              }}
            >
              <Trans>Plugins</Trans>
            </span>
          </div>
        </div>
        <div
          className="setting-close-container"
          onClick={() => {
            this.props.handleSetting(false);
          }}
        >
          <span className="icon-close setting-close"></span>
        </div>

        <div className="setting-dialog-info">
          {this.props.settingMode === "general" ? (
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
                      selected={
                        item.value ===
                        (ConfigService.getReaderConfig("lang") || "en")
                          ? true
                          : false
                      }
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
                      selected={
                        item.value ===
                        (ConfigService.getReaderConfig("searchEngine") ||
                          (navigator.language === "zh-CN" ? "baidu" : "google"))
                          ? true
                          : false
                      }
                    >
                      {this.props.t(item.label)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : this.props.settingMode === "reading" ? (
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
              {isElectron && (
                <>
                  <div className="setting-dialog-new-title">
                    <Trans>Reset reader window's position</Trans>

                    <span
                      className="change-location-button"
                      onClick={() => {
                        this.handleResetReaderPosition();
                      }}
                    >
                      <Trans>Reset</Trans>
                    </span>
                  </div>
                </>
              )}
            </>
          ) : this.props.settingMode === "appearance" ? (
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
                      selected={
                        item.value ===
                        (ConfigService.getReaderConfig("appSkin") || "system")
                          ? true
                          : false
                      }
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
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                      selected={
                        item.value ===
                        ConfigService.getReaderConfig("systemFont")
                          ? true
                          : false
                      }
                    >
                      {this.props.t(item.label)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : this.props.settingMode === "sync" ? (
            <>
              {this.props.settingDrive && (
                <div
                  className="voice-add-new-container"
                  style={{
                    marginLeft: "25px",
                    width: "calc(100% - 50px)",
                    fontWeight: 500,
                  }}
                >
                  {this.props.settingDrive === "webdav" ||
                  this.props.settingDrive === "ftp" ||
                  this.props.settingDrive === "sftp" ||
                  this.props.settingDrive === "s3compatible" ? (
                    <>
                      {driveInputConfig[this.props.settingDrive].map((item) => {
                        return (
                          <input
                            type={item.type}
                            name={item.value}
                            key={item.value}
                            placeholder={this.props.t(item.label)}
                            onChange={(e) => {
                              this.setState((prevState) => ({
                                driveConfig: {
                                  ...prevState.driveConfig,
                                  [item.value]: e.target.value,
                                },
                              }));
                            }}
                            id={"token-dialog-" + item.value + "-box"}
                            className="token-dialog-username-box"
                          />
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <textarea
                        className="token-dialog-token-box"
                        id="token-dialog-token-box"
                        placeholder={this.props.t(
                          "Please authorize your account, and fill the following box with the token"
                        )}
                        onChange={(e) => {
                          this.setState((prevState) => ({
                            driveConfig: {
                              ...prevState.driveConfig,
                              token: e.target.value,
                            },
                          }));
                        }}
                      />
                    </>
                  )}
                  <div className="token-dialog-button-container">
                    <div
                      className="voice-add-confirm"
                      onClick={async () => {
                        this.handleConfirmDrive();
                      }}
                    >
                      <Trans>Confirm</Trans>
                    </div>
                    <div className="voice-add-button-container">
                      <div
                        className="voice-add-cancel"
                        onClick={() => {
                          this.handleCancelDrive();
                        }}
                      >
                        <Trans>Cancel</Trans>
                      </div>
                      {(this.props.settingDrive === "dropbox" ||
                        this.props.settingDrive === "google" ||
                        this.props.settingDrive === "microsoft") && (
                        <div
                          className="voice-add-cancel"
                          style={{ marginRight: "10px" }}
                          onClick={() => {
                            this.handleJump(
                              new SyncUtil(
                                this.props.settingDrive,
                                {}
                              ).getAuthUrl()
                            );
                          }}
                        >
                          <Trans>Authorize</Trans>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="setting-dialog-new-title">
                <Trans>Add data source</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={this.handleAddDataSource}
                >
                  {[
                    { label: "Please select", value: "", isPro: false },
                    ...driveList,
                  ]
                    .filter(
                      (item) => !this.props.dataSourceList.includes(item.value)
                    )
                    .map((item) => (
                      <option
                        value={item.value}
                        key={item.value}
                        className="lang-setting-option"
                      >
                        {this.props.t(item.label) +
                          (item.isPro ? " (Pro)" : "")}
                      </option>
                    ))}
                </select>
              </div>
              <div className="setting-dialog-new-title">
                <Trans>Delete data source</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={this.handleDeleteDataSource}
                >
                  {[
                    { label: "Please select", value: "", isPro: false },
                    ...driveList,
                  ]
                    .filter(
                      (item) =>
                        this.props.dataSourceList.includes(item.value) ||
                        item.value === ""
                    )
                    .map((item) => (
                      <option
                        value={item.value}
                        key={item.value}
                        className="lang-setting-option"
                      >
                        {this.props.t(item.label) +
                          (item.isPro ? " (Pro)" : "")}
                      </option>
                    ))}
                </select>
              </div>
              <div className="setting-dialog-new-title">
                <Trans>Set default sync option</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={this.handleSetDefaultSyncOption}
                >
                  {[
                    { label: "Please select", value: "", isPro: false },
                    ...driveList,
                  ]
                    .filter(
                      (item) =>
                        this.props.dataSourceList.includes(item.value) ||
                        item.value === "" ||
                        item.value === "local"
                    )
                    .map((item) => (
                      <option
                        value={item.value}
                        key={item.value}
                        className="lang-setting-option"
                        selected={
                          item.value === this.props.defaultSyncOption
                            ? true
                            : false
                        }
                      >
                        {this.props.t(item.label) +
                          (item.isPro ? " (Pro)" : "")}
                      </option>
                    ))}
                </select>
              </div>
            </>
          ) : this.props.settingMode === "account" ? (
            <>
              {this.state.settingLogin && (
                <div
                  className="voice-add-new-container"
                  style={{
                    marginLeft: "25px",
                    width: "calc(100% - 50px)",
                    fontWeight: 500,
                  }}
                >
                  <textarea
                    className="token-dialog-token-box"
                    id="token-dialog-token-box"
                    placeholder={this.props.t(
                      "Please authorize your account, and fill the following box with the token"
                    )}
                    onChange={(e) => {
                      this.setState((prevState) => ({
                        loginConfig: {
                          ...prevState.loginConfig,
                          token: e.target.value,
                        },
                      }));
                    }}
                  />
                  <div className="token-dialog-button-container">
                    <div
                      className="voice-add-confirm"
                      onClick={async () => {
                        this.handleConfirmLoginOption();
                      }}
                    >
                      <Trans>Confirm</Trans>
                    </div>
                    <div className="voice-add-button-container">
                      <div
                        className="voice-add-cancel"
                        onClick={() => {
                          this.handleCancelLoginOption();
                        }}
                      >
                        <Trans>Cancel</Trans>
                      </div>

                      <div
                        className="voice-add-cancel"
                        style={{ marginRight: "10px" }}
                        onClick={() => {
                          let url = LoginHelper.getAuthUrl(
                            this.state.settingLogin,
                            "manual"
                          );
                          this.handleJump(url);
                        }}
                      >
                        <Trans>Authorize</Trans>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="setting-dialog-new-title">
                <Trans>Add login option</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={this.handleAddLoginOption}
                >
                  {[{ label: "Please select", value: "" }, ...loginList]
                    .filter(
                      (item) => !this.props.loginOptionList.includes(item.value)
                    )
                    .map((item) => (
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
                <Trans>Delete login option</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={this.handleDeleteLoginOption}
                >
                  {[{ label: "Please select", value: "" }, ...loginList]
                    .filter(
                      (item) =>
                        this.props.loginOptionList.includes(item.value) ||
                        item.value === ""
                    )
                    .map((item) => (
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
                <Trans>Log out</Trans>

                <span
                  className="change-location-button"
                  onClick={async () => {
                    await TokenService.deleteToken("is_authed");
                    await TokenService.deleteToken("access_token");
                    await TokenService.deleteToken("refresh_token");
                    this.props.handleFetchAuthed();
                    this.props.handleLoginOptionList([]);
                    toast.success(this.props.t("Log out successful"));
                  }}
                >
                  <Trans>Log out</Trans>
                </span>
              </div>
            </>
          ) : (
            <>
              {(this.props.plugins.length === 0 || this.state.isAddNew) && (
                <div
                  className="voice-add-new-container"
                  style={{
                    marginLeft: "25px",
                    width: "calc(100% - 50px)",
                    fontWeight: 500,
                  }}
                >
                  <textarea
                    name="url"
                    placeholder={this.props.t(
                      "Paste the code of the plugin here, check out document to learn how to get more plugins"
                    )}
                    id="voice-add-content-box"
                    className="voice-add-content-box"
                  />
                  <div className="token-dialog-button-container">
                    <div
                      className="voice-add-confirm"
                      onClick={async () => {
                        let value: string = (
                          document.querySelector(
                            "#voice-add-content-box"
                          ) as HTMLTextAreaElement
                        ).value;
                        if (value) {
                          let plugin = JSON.parse(value);
                          plugin.key = plugin.identifier;
                          if (!(await checkPlugin(plugin))) {
                            toast.error(
                              this.props.t("Plugin verification failed")
                            );
                            return;
                          }
                          if (
                            this.props.plugins.find(
                              (item) => item.key === plugin.key
                            )
                          ) {
                            await DatabaseService.updateRecord(
                              plugin,
                              "plugins"
                            );
                          } else {
                            await DatabaseService.saveRecord(plugin, "plugins");
                          }
                          this.props.handleFetchPlugins();
                          toast.success(this.props.t("Addition successful"));
                        }
                        this.setState({ isAddNew: false });
                      }}
                    >
                      <Trans>Confirm</Trans>
                    </div>
                    <div className="voice-add-button-container">
                      <div
                        className="voice-add-cancel"
                        onClick={() => {
                          this.setState({ isAddNew: false });
                        }}
                      >
                        <Trans>Cancel</Trans>
                      </div>
                      <div
                        className="voice-add-cancel"
                        style={{ marginRight: "10px" }}
                        onClick={() => {
                          if (
                            ConfigService.getReaderConfig("lang") === "zhCN" ||
                            ConfigService.getReaderConfig("lang") === "zhTW" ||
                            ConfigService.getReaderConfig("lang") === "zhMO"
                          ) {
                            openExternalUrl(
                              "https://www.koodoreader.com/zh/plugin"
                            );
                          } else {
                            openExternalUrl(
                              "https://www.koodoreader.com/en/plugin"
                            );
                          }
                        }}
                      >
                        <Trans>Document</Trans>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {this.props.plugins.map((item, index) => {
                return (
                  <div className="setting-dialog-new-title">
                    <span>
                      <span
                        className={`icon-${
                          item.type === "dictionary"
                            ? "dict"
                            : item.type === "voice"
                            ? "speaker"
                            : "translation"
                        } setting-plugin-icon`}
                      ></span>
                      <span className="setting-plugin-name">
                        {item.displayName}
                      </span>
                    </span>

                    <span
                      className="change-location-button"
                      onClick={async () => {
                        await DatabaseService.deleteRecord(item.key, "plugins");
                        this.props.handleFetchPlugins();
                        toast.success(this.props.t("Deletion successful"));
                      }}
                    >
                      <Trans>Delete</Trans>
                    </span>
                  </div>
                );
              })}

              {this.props.plugins.length > 0 && (
                <div
                  className="setting-dialog-new-plugin"
                  onClick={async () => {
                    this.setState({ isAddNew: true });
                  }}
                >
                  <Trans>Add new plugin</Trans>
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
