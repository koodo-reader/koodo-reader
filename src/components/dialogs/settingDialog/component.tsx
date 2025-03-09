import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import packageInfo from "../../../../package.json";
import {
  changeLibrary,
  changePath,
  removeCloudConfig,
} from "../../../utils/file/common";
import { isElectron } from "react-device-detect";
import { dropdownList } from "../../../constants/dropdownList";
import _ from "underscore";
import {
  generalSettingList,
  appearanceSettingList,
  readingSettingList,
  langList,
  searchList,
  skinList,
  syncSettingList,
} from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import {
  checkPlugin,
  formatTimestamp,
  handleContextMenu,
  loadFontData,
  openExternalUrl,
  WEBSITE_URL,
} from "../../../utils/common";
import { getStorageLocation, reloadManager } from "../../../utils/common";
import DatabaseService from "../../../utils/storage/databaseService";
import { driveInputConfig, driveList } from "../../../constants/driveList";
import {
  ConfigService,
  KookitConfig,
  LoginHelper,
  SyncUtil,
  TokenService,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  encryptToken,
  onSyncCallback,
} from "../../../utils/request/thirdparty";
import { loginList } from "../../../constants/loginList";
import {
  getTempToken,
  getUserRequest,
  loginRegister,
} from "../../../utils/request/user";
import { handleExitApp } from "../../../utils/request/common";
import copyTextToClipboard from "copy-text-to-clipboard";
import SyncService from "../../../utils/storage/syncService";
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
      isDisableMobilePrecache:
        ConfigService.getReaderConfig("isDisableMobilePrecache") === "yes",
      appSkin: ConfigService.getReaderConfig("appSkin"),
      isUseBuiltIn: ConfigService.getReaderConfig("isUseBuiltIn") === "yes",
      isKeepLocal: ConfigService.getReaderConfig("isKeepLocal") === "yes",
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
      this.props.handleFetchUserInfo();
    }
  }
  loadFont = () => {
    if (dropdownList[0].option.length <= 2) {
      loadFontData().then((result) => {
        dropdownList[0].option = dropdownList[0].option.concat(result);
      });
    }
  };
  handleRest = (_bool: boolean) => {
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
    if (
      stateName === "isKeepLocal" ||
      stateName === "isDisableMobilePrecache"
    ) {
      ConfigService.setItem(stateName, this.state[stateName] ? "no" : "yes");
    } else {
      ConfigService.setReaderConfig(
        stateName,
        this.state[stateName] ? "no" : "yes"
      );
    }

    this.handleRest(this.state[stateName]);
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
    ConfigService.setItem("storageLocation", newPath);
    this.setState({ storageLocation: newPath });
    toast.success(this.props.t("Change successful"));
    this.props.handleFetchBooks();
  };
  handleSwitchLibrary = async () => {
    const { ipcRenderer } = window.require("electron");
    const newPath = await ipcRenderer.invoke("select-path");
    if (!newPath) {
      return;
    }
    let isSuccess = await changeLibrary(newPath);
    if (!isSuccess) {
      toast.error(this.props.t("Switch failed"));
      return;
    }
    ConfigService.setItem("storageLocation", newPath);
    this.setState({ storageLocation: newPath });
    toast.success(this.props.t("Switch successful"));
    this.props.handleFetchBooks();
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
    await TokenService.setToken(event.target.value + "_token", "");
    SyncService.removeSyncUtil(event.target.value);
    removeCloudConfig(event.target.value);
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      await ipcRenderer.invoke("cloud-close", {
        service: event.target.value,
      });
    }
    ConfigService.deleteListConfig(event.target.value, "dataSourceList");
    this.props.handleFetchDataSourceList();
    toast.success(this.props.t("Deletion successful"));
  };
  handleSetDefaultSyncOption = (event: any) => {
    if (!event.target.value) {
      return;
    }
    ConfigService.setItem("defaultSyncOption", event.target.value);
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
    toast.loading(this.props.t("Removing..."), {
      id: "remove-login-option",
    });
    let userRequest = await getUserRequest();
    let response = await userRequest.removeLogin({
      provider: event.target.value,
    });
    if (response.code === 200) {
      toast.success(this.props.t("Removal successful"), {
        id: "remove-login-option",
      });
      this.props.handleFetchLoginOptionList();
    } else if (response.code === 401) {
      toast.error(
        this.props.t("Removal failed, error code") + ": " + response.msg,
        {
          id: "remove-login-option",
        }
      );
      handleExitApp();
      return;
    } else {
      toast.error(
        this.props.t("Removal failed, error code") + ": " + response.msg,
        {
          id: "remove-login-option",
        }
      );
    }
  };
  handleCancelLoginOption = async () => {
    this.setState({ settingLogin: "" });
  };
  handleConfirmLoginOption = async () => {
    if (!this.state.loginConfig.token || !this.state.settingLogin) {
      toast.error(this.props.t("Missing parameters") + this.props.t("Token"));
      return;
    }
    this.props.handleLoadingDialog(true);
    let res = { code: 200, msg: "success" };
    if (this.props.isAuthed) {
      let userRequest = await getUserRequest();
      res = await userRequest.addLogin({
        code: this.state.loginConfig.token,
        provider: this.state.settingLogin,
        scope:
          KookitConfig.LoginAuthRequest[this.state.settingLogin].extraParams
            .scope,
        redirect_uri: KookitConfig.ThirdpartyConfig.callbackUrl,
      });
    } else {
      res = await loginRegister(
        this.state.settingLogin,
        this.state.loginConfig.token
      );
    }
    if (res.code === 200) {
      this.props.handleLoadingDialog(false);
      toast.success(this.props.t("Login successful"));
      this.props.handleFetchAuthed();
      this.props.handleFetchLoginOptionList();
      this.props.handleFetchUserInfo();
      this.setState({ settingLogin: "" });
    } else {
      this.props.handleLoadingDialog(false);
      toast.error(this.props.t("Login failed, error code") + ": " + res.msg);
    }
  };
  handleCancelDrive = () => {
    this.props.handleSettingDrive("");
  };
  handleConfirmDrive = async () => {
    let flag = true;
    for (let item of driveInputConfig[this.props.settingDrive]) {
      if (!this.state.driveConfig[item.value]) {
        toast.error(
          this.props.t("Missing parameters") + ": " + this.props.t(item.label)
        );
        flag = false;
        break;
      }
    }
    if (!flag) {
      return;
    }
    if (
      this.props.settingDrive === "webdav" ||
      this.props.settingDrive === "ftp" ||
      this.props.settingDrive === "sftp" ||
      this.props.settingDrive === "mega" ||
      this.props.settingDrive === "s3compatible"
    ) {
      toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });
      let res = await encryptToken(
        this.props.settingDrive,
        this.state.driveConfig
      );
      if (res.code === 200) {
        ConfigService.setListConfig(this.props.settingDrive, "dataSourceList");
        toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
      } else {
        toast.error(i18n.t("Binding failed"), { id: "adding-sync-id" });
      }
    } else {
      await onSyncCallback(
        this.props.settingDrive,
        this.state.driveConfig.token
      );
    }
    if (this.props.isAuthed) {
      ConfigService.setItem("defaultSyncOption", this.props.settingDrive);
      this.props.handleFetchDefaultSyncOption();
    }
    this.props.handleFetchDataSourceList();
    this.props.handleSettingDrive("");
  };
  renderSwitchOption = (optionList: any[]) => {
    return optionList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <div className="setting-dialog-new-title" key={item.title}>
            <span style={{ width: "calc(100% - 100px)" }}>
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
              style={this.state[item.propName] ? {} : { opacity: 0.6 }}
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
    });
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
            <span
              className="book-bookmark-title"
              style={
                this.props.settingMode === "sync"
                  ? {
                      fontWeight: "bold",
                      borderBottom: "2px solid",
                      lineHeight: "20px",
                    }
                  : { opacity: 0.5, lineHeight: "20px" }
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
          </div>
        </div>
        <div
          className="setting-close-container"
          onClick={() => {
            this.props.handleSetting(false);
            this.props.handleSettingMode("general");
          }}
        >
          <span className="icon-close setting-close"></span>
        </div>

        <div className="setting-dialog-info">
          {this.props.settingMode === "general" ? (
            <>
              {this.renderSwitchOption(generalSettingList)}

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
                  <p className="setting-option-subtitle">
                    <Trans>
                      {
                        "Modify the storage location of the library, and the library will be moved to the new location. Please ensure that the new folder is empty"
                      }
                    </Trans>
                  </p>
                  <div className="setting-dialog-location-title">
                    {this.state.storageLocation}
                  </div>
                </>
              )}
              {isElectron && (
                <>
                  <div className="setting-dialog-new-title">
                    <Trans>Switch Library</Trans>

                    <span
                      className="change-location-button"
                      onClick={() => {
                        this.handleSwitchLibrary();
                      }}
                    >
                      <Trans>Select</Trans>
                    </span>
                  </div>
                  <p className="setting-option-subtitle">
                    <Trans>
                      {
                        "Switch between multiple libraries without affecting the original library. For multi-device synchronization in the free version, please refer to the documentation"
                      }
                    </Trans>
                  </p>
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
              {this.renderSwitchOption(readingSettingList)}
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
              {this.renderSwitchOption(appearanceSettingList)}
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
                  this.props.settingDrive === "mega" ||
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
                              if (e.target.value) {
                                this.setState((prevState) => ({
                                  driveConfig: {
                                    ...prevState.driveConfig,
                                    [item.value]: e.target.value.trim(),
                                  },
                                }));
                              }
                            }}
                            onContextMenu={() => {
                              handleContextMenu(
                                "token-dialog-" + item.value + "-box",
                                true
                              );
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
                          if (e.target.value) {
                            this.setState((prevState) => ({
                              driveConfig: {
                                ...prevState.driveConfig,
                                token: e.target.value.trim(),
                              },
                            }));
                          }
                        }}
                        onContextMenu={() => {
                          handleContextMenu("token-dialog-token-box");
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
                      <Trans>Bind</Trans>
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
                        this.props.settingDrive === "boxnet" ||
                        this.props.settingDrive === "pcloud" ||
                        this.props.settingDrive === "adrive" ||
                        this.props.settingDrive === "microsoft") && (
                        <div
                          className="voice-add-confirm"
                          style={{ marginRight: "10px" }}
                          onClick={async () => {
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
                      {isElectron &&
                        (this.props.settingDrive === "webdav" ||
                          this.props.settingDrive === "ftp" ||
                          this.props.settingDrive === "sftp" ||
                          this.props.settingDrive === "mega" ||
                          this.props.settingDrive === "s3compatible") && (
                          <div
                            className="voice-add-confirm"
                            style={{ marginRight: "10px" }}
                            onClick={async () => {
                              toast.loading(
                                this.props.t("Testing connection..."),
                                {
                                  id: "testing-connection-id",
                                }
                              );
                              const { ipcRenderer } =
                                window.require("electron");
                              const fs = window.require("fs");
                              fs.writeFileSync(
                                getStorageLocation() + "/config/test.txt",
                                "Hello world!"
                              );
                              let driveConfig: any = {};
                              for (let item in this.state.driveConfig) {
                                driveConfig[item] =
                                  this.state.driveConfig[item];
                              }
                              let result = await ipcRenderer.invoke(
                                "cloud-upload",
                                {
                                  ...driveConfig,
                                  fileName: "test.txt",
                                  service: this.props.settingDrive,
                                  type: "config",
                                  storagePath: getStorageLocation(),
                                  isUseCache: false,
                                }
                              );
                              if (result) {
                                toast.success(
                                  this.props.t("Connection successful"),
                                  {
                                    id: "testing-connection-id",
                                  }
                                );
                                await ipcRenderer.invoke("cloud-delete", {
                                  ...driveConfig,
                                  fileName: "test.txt",
                                  service: this.props.settingDrive,
                                  type: "config",
                                  storagePath: getStorageLocation(),
                                  isUseCache: false,
                                });
                              } else {
                                toast.error(this.props.t("Connection failed"), {
                                  id: "testing-connection-id",
                                });
                              }
                              fs.unlinkSync(
                                getStorageLocation() + "/config/test.txt"
                              );
                            }}
                          >
                            <Trans>Test</Trans>
                          </div>
                        )}
                      {(this.props.settingDrive === "webdav" ||
                        this.props.settingDrive === "ftp" ||
                        this.props.settingDrive === "sftp") &&
                        (ConfigService.getReaderConfig("lang") === "zhCN" ||
                          ConfigService.getReaderConfig("lang") === "zhTW" ||
                          ConfigService.getReaderConfig("lang") === "zhMO") && (
                          <div
                            className="voice-add-cancel"
                            style={{ borderWidth: 0 }}
                            onClick={() => {
                              openExternalUrl(WEBSITE_URL + "/zh/add-source");
                            }}
                          >
                            {this.props.t("How to fill out")}
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
              {this.props.isAuthed && (
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
              )}
              {this.renderSwitchOption(syncSettingList)}
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
                    onContextMenu={() => {
                      handleContextMenu("token-dialog-token-box");
                    }}
                    onChange={(e) => {
                      if (e.target.value) {
                        this.setState((prevState) => ({
                          loginConfig: {
                            ...prevState.loginConfig,
                            token: e.target.value.trim(),
                          },
                        }));
                      }
                    }}
                  />
                  <div className="token-dialog-button-container">
                    <div
                      className="voice-add-confirm"
                      onClick={async () => {
                        this.handleConfirmLoginOption();
                      }}
                    >
                      <Trans>Bind</Trans>
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
                        className="voice-add-confirm"
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
                    .filter((item) => {
                      if (this.props.loginOptionList.length > 0) {
                        return !this.props.loginOptionList.includes(item.value);
                      } else {
                        return true;
                      }
                    })
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
                    .filter((item) => {
                      if (item.value === "") {
                        return true;
                      }
                      if (this.props.loginOptionList.length > 0) {
                        return this.props.loginOptionList.includes(item.value);
                      } else {
                        return false;
                      }
                    })
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

              {this.props.isAuthed && (
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
              )}
              {this.props.isAuthed && (
                <div className="setting-dialog-new-title">
                  <Trans>Get device identifier</Trans>

                  <span
                    className="change-location-button"
                    onClick={async () => {
                      let fingerPrint = await TokenService.getFingerprint();
                      copyTextToClipboard(fingerPrint);
                      toast.success(this.props.t("Copied"));
                    }}
                  >
                    <Trans>Copy</Trans>
                  </span>
                </div>
              )}
              {this.props.isAuthed && (
                <div className="setting-dialog-new-title">
                  <Trans>Get error log</Trans>

                  <span
                    className="change-location-button"
                    onClick={async () => {
                      let errorLog = ConfigService.getItem("errorLog") || "";
                      if (isElectron) {
                        const { ipcRenderer } = window.require("electron");
                        let log = await ipcRenderer.invoke("get-store-value", {
                          key: "errorLog",
                        });
                        errorLog += log || "";
                      }
                      copyTextToClipboard(errorLog);
                      toast.success(this.props.t("Copied"));
                    }}
                  >
                    <Trans>Copy</Trans>
                  </span>
                </div>
              )}
              {this.props.isAuthed && this.props.userInfo && (
                <div className="setting-dialog-new-title">
                  <Trans>Account type</Trans>
                  <div>
                    <Trans>
                      {this.props.userInfo.type === "trial"
                        ? "Trial user"
                        : this.props.userInfo.type === "pro"
                        ? "Paid user"
                        : "Free user"}
                    </Trans>
                    <>
                      {" ("}
                      <Trans
                        i18nKey="Valid until"
                        label={this.props.userInfo.valid_until}
                      >
                        Valid until
                        {{
                          label: formatTimestamp(
                            this.props.userInfo.valid_until * 1000
                          ),
                        }}
                      </Trans>
                      {")"}
                    </>
                  </div>
                </div>
              )}
              {this.props.isAuthed && this.props.userInfo && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: 20,
                  }}
                >
                  <div
                    className="new-version-open"
                    onClick={async () => {
                      let response = await getTempToken();
                      if (response.code === 200) {
                        let tempToken = response.data.access_token;
                        let deviceUuid = await TokenService.getFingerprint();
                        openExternalUrl(
                          WEBSITE_URL +
                            (ConfigService.getReaderConfig("lang").startsWith(
                              "zh"
                            )
                              ? "zh"
                              : "en") +
                            "/pricing?temp_token=" +
                            tempToken +
                            "&device_uuid=" +
                            deviceUuid
                        );
                      } else if (response.code === 401) {
                        this.props.handleFetchAuthed();
                      }
                    }}
                    style={{
                      fontWeight: "bold",
                      position: "absolute",
                      bottom: "20px",
                      paddingLeft: "20px",
                      paddingRight: "20px",
                    }}
                  >
                    <Trans>
                      {this.props.userInfo.valid_until <
                      parseInt(new Date().getTime() / 1000 + "")
                        ? "Upgrade to Pro"
                        : "Renew Pro"}
                    </Trans>
                  </div>
                </div>
              )}
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
                    onContextMenu={() => {
                      handleContextMenu("voice-add-content-box");
                    }}
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
                            openExternalUrl(WEBSITE_URL + "/zh/plugin");
                          } else {
                            openExternalUrl(WEBSITE_URL + "/en/plugin");
                          }
                        }}
                      >
                        <Trans>Document</Trans>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {this.props.plugins.map((item) => {
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
