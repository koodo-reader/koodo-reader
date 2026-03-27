import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import packageInfo from "../../../../package.json";
import { isElectron } from "react-device-detect";
import { dropdownList } from "../../../constants/dropdownList";
import {
  appearanceSettingList,
  readingSettingList,
  skinList,
} from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import { Panel as ColorPickerPanel } from "rc-color-picker";
import "rc-color-picker/assets/index.css";
import toast from "react-hot-toast";
import { loadFontData } from "../../../utils/common";
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
      isAutoMaximize: ConfigService.getReaderConfig("isAutoMaximize") === "yes",
      isLemmatizeWord:
        ConfigService.getReaderConfig("isLemmatizeWord") === "yes",
      isOpenBook: ConfigService.getReaderConfig("isOpenBook") === "yes",

      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isManualScroll: ConfigService.getReaderConfig("isManualScroll") === "yes",
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
      isDisableCrop: ConfigService.getReaderConfig("isDisableCrop") === "yes",
      isOverwriteText:
        ConfigService.getReaderConfig("isOverwriteText") === "yes",
      isOverwriteLink:
        ConfigService.getReaderConfig("isOverwriteLink") === "yes",
      isDisablePDFCover:
        ConfigService.getReaderConfig("isDisablePDFCover") === "yes",
      currentThemeIndex: themeList.findIndex(
        (item) =>
          item.color ===
          (ConfigService.getReaderConfig("themeColor") || "default")
      ),
      isShowCustomColorPicker: false,
      customColor: ConfigService.getReaderConfig("themeColor") || "#0179CA",
      pendingCustomColor:
        ConfigService.getReaderConfig("themeColor") || "#0179CA",
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
    const fontFamilyItem = dropdownList.find(
      (item) => item.value === "fontFamily"
    );
    const subFontFamilyItem = dropdownList.find(
      (item) => item.value === "subFontFamily"
    );

    loadFontData().then((result) => {
      if (fontFamilyItem && fontFamilyItem.option.length <= 2) {
        fontFamilyItem.option = fontFamilyItem.option.concat(result);
      }
      if (subFontFamilyItem && subFontFamilyItem.option.length <= 2) {
        subFontFamilyItem.option = subFontFamilyItem.option.concat(result);
      }
    });
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
  };
  handleResetReaderPosition = () => {
    window
      .require("electron")
      .ipcRenderer.invoke("reset-reader-position", "ping");
    toast.success(this.props.t("Reset successful"));
  };
  handleTheme = (color: string, index: number) => {
    this.setState({
      currentThemeIndex: index,
      isShowCustomColorPicker: false,
    });
    ConfigService.setReaderConfig("themeColor", color);
    reloadManager();
  };
  handleCustomColor = (colorObj: any) => {
    const color = colorObj.color;
    this.setState({ pendingCustomColor: color });
  };
  handleConfirmCustomColor = () => {
    const color = this.state.pendingCustomColor;
    this.setState({
      customColor: color,
      currentThemeIndex: -1,
      isShowCustomColorPicker: false,
    });
    ConfigService.setReaderConfig("themeColor", color);
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
              className="book-bookmark-title setting-tab"
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
              className="book-bookmark-title setting-tab"
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
              className="book-bookmark-title setting-tab"
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
              className="book-bookmark-title setting-tab"
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
              className="book-bookmark-title setting-tab"
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
              className="book-bookmark-title setting-tab"
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
                <Trans>System font</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  onChange={(event) => {
                    this.changeFont(event.target.value);
                  }}
                >
                  {dropdownList
                    .find((item) => item.value === "fontFamily")
                    ?.option.map((item) => (
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
              <div className="setting-dialog-new-title">
                <Trans>Theme color</Trans>
              </div>
              <ul className="theme-setting-container">
                {themeList.map((item, index) => (
                  <li
                    className={
                      index === this.state.currentThemeIndex
                        ? "theme-setting-item active-theme-item"
                        : "theme-setting-item"
                    }
                    key={item.color}
                    onClick={() => {
                      this.handleTheme(item.color, index);
                    }}
                    style={{
                      color:
                        item.color === "default"
                          ? "rgba(75, 75, 75, 1)"
                          : item.color,
                    }}
                  >
                    <span
                      className="theme-setting-dot"
                      style={{
                        backgroundColor:
                          item.color === "default"
                            ? "rgba(75, 75, 75, 1)"
                            : item.color,
                      }}
                    ></span>
                    <span className="theme-setting-title">
                      <Trans>{item.title}</Trans>
                    </span>
                  </li>
                ))}
                <li
                  className={
                    this.state.currentThemeIndex === -1
                      ? "theme-setting-item active-theme-item"
                      : "theme-setting-item"
                  }
                  onClick={() => {
                    this.setState({
                      isShowCustomColorPicker:
                        !this.state.isShowCustomColorPicker,
                      pendingCustomColor: this.state.customColor,
                    });
                  }}
                  style={{ color: this.state.customColor }}
                >
                  <span
                    className="theme-setting-dot"
                    style={{
                      backgroundColor:
                        this.state.currentThemeIndex === -1
                          ? this.state.customColor
                          : undefined,
                    }}
                  >
                    <span
                      className={
                        this.state.isShowCustomColorPicker
                          ? "icon-check"
                          : "icon-more"
                      }
                      style={{
                        fontSize: "12px",
                        position: "relative",
                        top: "2px",
                        left: "2px",
                      }}
                    ></span>
                  </span>
                  <span className="theme-setting-title">
                    <Trans>Custom</Trans>
                  </span>
                </li>
              </ul>
              {this.state.isShowCustomColorPicker && (
                <div className="custom-color-picker-container">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <ColorPickerPanel
                      enableAlpha={false}
                      color={this.state.pendingCustomColor}
                      onChange={this.handleCustomColor}
                      mode="RGB"
                      style={{
                        margin: "10px 0",
                        animation: "fade-in 0.2s ease-in-out 0s 1",
                      }}
                    />
                    <span
                      className="change-location-button"
                      onClick={this.handleConfirmCustomColor}
                      style={{ marginBottom: "10px" }}
                    >
                      <Trans>Confirm</Trans>
                    </span>
                  </div>
                </div>
              )}
              <div className="setting-dialog-new-title">
                <Trans>Appearance</Trans>
              </div>
              <ul className="skin-setting-container">
                {skinList.map((item) => (
                  <li
                    key={item.value}
                    className={
                      item.value ===
                      (ConfigService.getReaderConfig("appSkin") || "system")
                        ? "skin-setting-item active-skin-item"
                        : "skin-setting-item"
                    }
                    onClick={() => {
                      this.changeSkin(item.value);
                    }}
                  >
                    <span
                      className="skin-setting-icon"
                      dangerouslySetInnerHTML={{ __html: item.icon }}
                    />
                    <Trans>{item.label}</Trans>
                  </li>
                ))}
              </ul>
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
