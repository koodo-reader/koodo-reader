import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import packageInfo from "../../../../package.json";
import { changeLibrary, changePath } from "../../../utils/file/common";
import { isElectron } from "react-device-detect";
import { dropdownList } from "../../../constants/dropdownList";
import _ from "underscore";
import {
  appearanceSettingList,
  readingSettingList,
  skinList,
} from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import { loadFontData, openExternalUrl } from "../../../utils/common";
import { getStorageLocation, reloadManager } from "../../../utils/common";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import GeneralSetting from "../../../containers/settings/generalSetting";
import SyncSetting from "../../../containers/settings/syncSetting";
import AccountSetting from "../../../containers/settings/accountSetting";
import PluginSetting from "../../../containers/settings/pluginSetting";
declare var window: any;
class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      isMergeWord: ConfigService.getReaderConfig("isMergeWord") === "yes",
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isAutoFullscreen:
        ConfigService.getReaderConfig("isAutoFullscreen") === "yes",
      isPreventAdd: ConfigService.getReaderConfig("isPreventAdd") === "yes",
      isLemmatizeWord:
        ConfigService.getReaderConfig("isLemmatizeWord") === "yes",
      isOpenBook: ConfigService.getReaderConfig("isOpenBook") === "yes",

      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isDisableAutoScroll:
        ConfigService.getReaderConfig("isDisableAutoScroll") === "yes",
      isDisableTrashBin:
        ConfigService.getReaderConfig("isDisableTrashBin") === "yes",
      isDeleteShelfBook:
        ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      isPreventSleep: ConfigService.getReaderConfig("isPreventSleep") === "yes",
      isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
      isPrecacheBook: ConfigService.getReaderConfig("isPrecacheBook") === "yes",
      appSkin: ConfigService.getReaderConfig("appSkin"),
      isUseBuiltIn: ConfigService.getReaderConfig("isUseBuiltIn") === "yes",
      isDisableCrop: ConfigService.getReaderConfig("isDisableCrop") === "yes",
      isDisablePagination:
        ConfigService.getReaderConfig("isDisablePagination") === "yes",
      isOverwriteLink:
        ConfigService.getReaderConfig("isOverwriteLink") === "yes",
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
  handleSetting = (stateName: string) => {
    if (stateName === "isLemmatizeWord" && !this.props.isAuthed) {
      toast.error(
        this.props.t("This feature is not available in the free version")
      );
      return;
    }
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
    if (stateName === "isDisablePagination") {
      reloadManager();
    }
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
            <GeneralSetting />
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
            <SyncSetting />
          ) : this.props.settingMode === "account" ? (
            <AccountSetting />
          ) : (
            <PluginSetting />
          )}
        </div>
      </div>
    );
  }
}

export default SettingDialog;
