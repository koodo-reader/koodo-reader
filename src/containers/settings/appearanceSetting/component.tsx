import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  appearanceSettingList,
  skinList,
} from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import { Panel as ColorPickerPanel } from "rc-color-picker";
import "rc-color-picker/assets/index.css";
import { dropdownList } from "../../../constants/dropdownList";
import {
  loadFontData,
  reloadManager,
  vexComfirmAsync,
} from "../../../utils/common";
import { applyCustomSystemCSS } from "../../../utils/reader/launchUtil";

class AppearanceSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      appSkin: ConfigService.getReaderConfig("appSkin"),
      currentThemeIndex: themeList.findIndex(
        (item) =>
          item.color ===
          (ConfigService.getReaderConfig("themeColor") || "default")
      ),
      isShowCustomColorPicker: false,
      customColor: ConfigService.getReaderConfig("themeColor") || "#0179CA",
      pendingCustomColor:
        ConfigService.getReaderConfig("themeColor") || "#0179CA",
      fontListVersion: 0,
      isDisablePDFCover:
        ConfigService.getReaderConfig("isDisablePDFCover") === "yes",
      isDisableCrop: ConfigService.getReaderConfig("isDisableCrop") === "yes",
      isCustomSystemCSS:
        ConfigService.getReaderConfig("isCustomSystemCSS") === "yes",
      customSystemCSS: ConfigService.getReaderConfig("customSystemCSS") || "",
    };
  }

  componentDidMount(): void {
    this.loadFont();
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
        fontFamilyItem.option = fontFamilyItem.option.concat(result || []);
      }
      if (subFontFamilyItem && subFontFamilyItem.option.length <= 2) {
        subFontFamilyItem.option = subFontFamilyItem.option.concat(
          result || []
        );
      }
      this.setState((prevState) => ({
        fontListVersion: prevState.fontListVersion + 1,
      }));
    });
  };

  handleRest = (_bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };

  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
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
      vexComfirmAsync(
        this.props.t(
          "Please install local fonts to your machine and then restart the application"
        )
      );

      return;
    }
    let body = document.getElementsByTagName("body")[0];
    body?.setAttribute("style", "font-family:" + font + "!important");
    ConfigService.setReaderConfig("systemFont", font);
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
                this.handleSetting(item.propName);
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
                    item.value === ConfigService.getReaderConfig("systemFont")
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
                  item.color === "default" ? "rgba(75, 75, 75, 1)" : item.color,
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
                isShowCustomColorPicker: !this.state.isShowCustomColorPicker,
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
        <div className="setting-dialog-new-title">
          <Trans>Custom app style</Trans>
          <span
            className="single-control-switch"
            onClick={() => {
              const next = !this.state.isCustomSystemCSS;
              this.setState({ isCustomSystemCSS: next }, () => {
                ConfigService.setReaderConfig(
                  "isCustomSystemCSS",
                  next ? "yes" : "no"
                );
                if (!this.state.customSystemCSS) {
                  return;
                }
                applyCustomSystemCSS();
                this.handleRest(next);
              });
            }}
            style={this.state.isCustomSystemCSS ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                this.state.isCustomSystemCSS
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
          <Trans>
            Customize the appearance of the entire application with CSS
          </Trans>
        </p>
        {this.state.isCustomSystemCSS && (
          <div style={{ margin: "10px 25px" }}>
            <textarea
              className="token-dialog-token-box"
              placeholder={
                "/* " + this.props.t("Enter custom CSS here") + " */"
              }
              value={this.state.customSystemCSS}
              onChange={(e) => {
                this.setState({ customSystemCSS: e.target.value });
              }}
              onBlur={() => {
                ConfigService.setReaderConfig(
                  "customSystemCSS",
                  this.state.customSystemCSS
                );
                applyCustomSystemCSS();
                this.handleRest(true);
              }}
            />
          </div>
        )}
      </>
    );
  }
}

export default AppearanceSetting;
