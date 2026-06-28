import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import {
  ConfigService,
  HighlightUtil,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  appearanceSettingList,
  skinList,
} from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import { HexColorPicker } from "react-colorful";
import { reloadManager, parseColorInput } from "../../../utils/common";
import FontUtil from "../../../utils/file/fontUtil";
import {
  applyCustomSystemCSS,
  applyCustomSystemFont,
  syncNativeThemeSource,
} from "../../../utils/reader/launchUtil";

class AppearanceSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  highlightUtil: any;
  constructor(props: SettingInfoProps) {
    super(props);
    this.highlightUtil = new HighlightUtil(ConfigService);
    const ttsHighlight = this.highlightUtil.getTtsHighlightValue();
    const searchHighlight = this.highlightUtil.getSearchHighlightValue();
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
      fontOptions: [] as { label: string; value: string }[],
      isDisablePDFCover:
        ConfigService.getReaderConfig("isDisablePDFCover") === "yes",
      isDisableCrop: ConfigService.getReaderConfig("isDisableCrop") === "yes",
      isShowShelfBookCount:
        ConfigService.getReaderConfig("isShowShelfBookCount") === "yes",
      isCustomSystemCSS:
        ConfigService.getReaderConfig("isCustomSystemCSS") === "yes",
      customSystemCSS: ConfigService.getReaderConfig("customSystemCSS") || "",
      ttsHighlightStyleType: ttsHighlight.styleType,
      ttsHighlightColor: ttsHighlight.color,
      isShowTtsCustomColorPicker: false,
      pendingTtsCustomColor: ttsHighlight.color,
      searchHighlightStyleType: searchHighlight.styleType,
      searchHighlightColor: searchHighlight.color,
      isShowSearchCustomColorPicker: false,
      pendingSearchCustomColor: searchHighlight.color,
    };
  }

  componentDidMount(): void {
    this.loadFont();
    window.addEventListener("font-list-changed", this.loadFont);
  }

  componentWillUnmount(): void {
    window.removeEventListener("font-list-changed", this.loadFont);
  }

  loadFont = async () => {
    const options = await FontUtil.getMergedFontOptions();
    this.setState((prevState) => ({
      fontOptions: options,
      fontListVersion: prevState.fontListVersion + 1,
    }));
  };

  handleRest = (_bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };

  handleSetting = (stateName: string) => {
    const nextValue = !this.state[stateName];
    this.setState({ [stateName]: nextValue } as any);
    ConfigService.setReaderConfig(stateName, nextValue ? "yes" : "no");
    this.handleRest(nextValue);
  };

  changeSkin = (skin: string) => {
    ConfigService.setReaderConfig("appSkin", skin);
    syncNativeThemeSource(skin);

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

  changeFont = async (font: string) => {
    ConfigService.setReaderConfig(
      "systemFont",
      font === "Built-in font" ? "" : font
    );
    await applyCustomSystemFont();
    this.forceUpdate();
  };

  handleTheme = (color: string, index: number) => {
    this.setState({
      currentThemeIndex: index,
      isShowCustomColorPicker: false,
    });
    ConfigService.setReaderConfig("themeColor", color);
    reloadManager();
  };

  handleCustomColor = (color: string) => {
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

  handleTtsStyleType = (styleType: string) => {
    const color = KookitConfig.KookitConfig.HighlightPresetColors[styleType][0];
    this.setState({
      ttsHighlightStyleType: styleType,
      ttsHighlightColor: color,
      isShowTtsCustomColorPicker: false,
      pendingTtsCustomColor: color,
    });
    this.highlightUtil.saveTtsHighlightValue({ styleType, color });
  };

  handleTtsPresetColor = (index: number) => {
    const styleType = this.state.ttsHighlightStyleType;
    const color =
      KookitConfig.KookitConfig.HighlightPresetColors[styleType][index];
    this.setState({
      ttsHighlightColor: color,
      isShowTtsCustomColorPicker: false,
    });
    this.highlightUtil.saveTtsHighlightValue({ styleType, color });
  };

  handleTtsCustomColor = (color: string) => {
    this.setState({ pendingTtsCustomColor: color });
  };

  handleConfirmTtsCustomColor = () => {
    const styleType = this.state.ttsHighlightStyleType;
    const color = this.state.pendingTtsCustomColor;
    this.setState({
      ttsHighlightColor: color,
      isShowTtsCustomColorPicker: false,
    });
    this.highlightUtil.saveTtsHighlightValue({ styleType, color });
    this.handleRest(true);
  };

  handleSearchStyleType = (styleType: string) => {
    const color = KookitConfig.HighlightPresetColors[styleType][0];
    this.setState({
      searchHighlightStyleType: styleType,
      searchHighlightColor: color,
      isShowSearchCustomColorPicker: false,
      pendingSearchCustomColor: color,
    });
    this.highlightUtil.saveSearchHighlightValue({ styleType, color });
  };

  handleSearchPresetColor = (index: number) => {
    const styleType = this.state.searchHighlightStyleType;
    const color = KookitConfig.HighlightPresetColors[styleType][index];
    this.setState({
      searchHighlightColor: color,
      isShowSearchCustomColorPicker: false,
    });
    this.highlightUtil.saveSearchHighlightValue({ styleType, color });
  };

  handleSearchCustomColor = (color: string) => {
    this.setState({ pendingSearchCustomColor: color });
  };

  handleConfirmSearchCustomColor = () => {
    const styleType = this.state.searchHighlightStyleType;
    const color = this.state.pendingSearchCustomColor;
    this.setState({
      searchHighlightColor: color,
      isShowSearchCustomColorPicker: false,
    });
    this.highlightUtil.saveSearchHighlightValue({ styleType, color });
    this.handleRest(true);
  };

  renderTtsHighlightSetting = () => {
    const styleType = this.state.ttsHighlightStyleType;
    const currentColor = this.state.ttsHighlightColor;
    const presetColors = KookitConfig.HighlightPresetColors[styleType];
    const isCustomSelected = !presetColors.includes(currentColor);

    return (
      <>
        <div className="setting-dialog-new-title">
          <Trans>TTS highlight style</Trans>
        </div>
        <p className="setting-option-subtitle">
          <Trans>
            Customize the highlight style when listening to audiobooks
          </Trans>
        </p>
        <ul className="tts-highlight-style-tabs">
          {KookitConfig.HighlightStyleTypes.map((item) => {
            const previewColor =
              item.value === styleType
                ? currentColor
                : KookitConfig.HighlightPresetColors[item.value][0];
            return (
              <li
                key={item.value}
                className={
                  styleType === item.value
                    ? "tts-highlight-style-tab active-tts-highlight-tab"
                    : "tts-highlight-style-tab"
                }
                onClick={() => this.handleTtsStyleType(item.value)}
              >
                <span
                  className="tts-highlight-style-preview"
                  style={this.highlightUtil.buildTtsHighlightPreviewStyle(
                    item.value,
                    previewColor
                  )}
                >
                  Aa
                </span>
                <span className="tts-highlight-style-label">
                  <Trans>{item.label}</Trans>
                </span>
              </li>
            );
          })}
        </ul>
        <ul className="tts-highlight-color-container">
          {presetColors.map((color, index) => (
            <li
              key={color}
              className={
                !isCustomSelected &&
                presetColors.indexOf(currentColor) === index
                  ? "tts-highlight-color-item active-tts-highlight-color"
                  : "tts-highlight-color-item"
              }
              style={{ backgroundColor: color }}
              onClick={() => this.handleTtsPresetColor(index)}
            />
          ))}
          <li
            className={
              isCustomSelected
                ? "tts-highlight-color-item tts-highlight-custom-color active-tts-highlight-color"
                : "tts-highlight-color-item tts-highlight-custom-color"
            }
            style={
              isCustomSelected ? { backgroundColor: currentColor } : undefined
            }
            onClick={() => {
              this.setState({
                isShowTtsCustomColorPicker:
                  !this.state.isShowTtsCustomColorPicker,
                pendingTtsCustomColor: currentColor,
              });
            }}
          >
            <span
              className={
                this.state.isShowTtsCustomColorPicker
                  ? "icon-check"
                  : "icon-more"
              }
              style={{ fontSize: "18px" }}
            />
          </li>
        </ul>
        {this.state.isShowTtsCustomColorPicker && (
          <div className="custom-color-picker-container">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <HexColorPicker
                color={this.state.pendingTtsCustomColor}
                onChange={this.handleTtsCustomColor}
                style={{
                  margin: "10px 0",
                  animation: "fade-in 0.2s ease-in-out 0s 1",
                }}
              />
              <input
                className="color-input-box"
                style={{ marginBottom: 8 }}
                value={this.state.pendingTtsCustomColor}
                placeholder="#rrggbb / rgba(r,g,b,a)"
                onChange={(e) =>
                  this.setState({ pendingTtsCustomColor: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const hex = parseColorInput(
                      this.state.pendingTtsCustomColor
                    );
                    if (hex) this.setState({ pendingTtsCustomColor: hex });
                  }
                }}
                onBlur={() => {
                  const hex = parseColorInput(this.state.pendingTtsCustomColor);
                  if (hex) this.setState({ pendingTtsCustomColor: hex });
                }}
              />
              <span
                className="change-location-button"
                onClick={this.handleConfirmTtsCustomColor}
                style={{ marginBottom: "10px" }}
              >
                <Trans>Confirm</Trans>
              </span>
            </div>
          </div>
        )}
      </>
    );
  };

  renderSearchHighlightSetting = () => {
    const styleType = this.state.searchHighlightStyleType;
    const currentColor = this.state.searchHighlightColor;
    const presetColors = KookitConfig.HighlightPresetColors[styleType];
    const isCustomSelected = !presetColors.includes(currentColor);

    return (
      <>
        <div className="setting-dialog-new-title">
          <Trans>Search highlight style</Trans>
        </div>
        <p className="setting-option-subtitle">
          <Trans>Customize the highlight style when searching in books</Trans>
        </p>
        <ul className="tts-highlight-style-tabs">
          {KookitConfig.HighlightStyleTypes.map((item) => {
            const previewColor =
              item.value === styleType
                ? currentColor
                : KookitConfig.HighlightPresetColors[item.value][0];
            return (
              <li
                key={item.value}
                className={
                  styleType === item.value
                    ? "tts-highlight-style-tab active-tts-highlight-tab"
                    : "tts-highlight-style-tab"
                }
                onClick={() => this.handleSearchStyleType(item.value)}
              >
                <span
                  className="tts-highlight-style-preview"
                  style={this.highlightUtil.buildSearchHighlightPreviewStyle(
                    item.value,
                    previewColor
                  )}
                >
                  Aa
                </span>
                <span className="tts-highlight-style-label">
                  <Trans>{item.label}</Trans>
                </span>
              </li>
            );
          })}
        </ul>
        <ul className="tts-highlight-color-container">
          {presetColors.map((color, index) => (
            <li
              key={color}
              className={
                !isCustomSelected &&
                presetColors.indexOf(currentColor) === index
                  ? "tts-highlight-color-item active-tts-highlight-color"
                  : "tts-highlight-color-item"
              }
              style={{ backgroundColor: color }}
              onClick={() => this.handleSearchPresetColor(index)}
            />
          ))}
          <li
            className={
              isCustomSelected
                ? "tts-highlight-color-item tts-highlight-custom-color active-tts-highlight-color"
                : "tts-highlight-color-item tts-highlight-custom-color"
            }
            style={
              isCustomSelected ? { backgroundColor: currentColor } : undefined
            }
            onClick={() => {
              this.setState({
                isShowSearchCustomColorPicker:
                  !this.state.isShowSearchCustomColorPicker,
                pendingSearchCustomColor: currentColor,
              });
            }}
          >
            <span
              className={
                this.state.isShowSearchCustomColorPicker
                  ? "icon-check"
                  : "icon-more"
              }
              style={{ fontSize: "18px" }}
            />
          </li>
        </ul>
        {this.state.isShowSearchCustomColorPicker && (
          <div className="custom-color-picker-container">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <HexColorPicker
                color={this.state.pendingSearchCustomColor}
                onChange={this.handleSearchCustomColor}
                style={{
                  margin: "10px 0",
                  animation: "fade-in 0.2s ease-in-out 0s 1",
                }}
              />
              <input
                className="color-input-box"
                style={{ marginBottom: 8 }}
                value={this.state.pendingSearchCustomColor}
                placeholder="#rrggbb / rgba(r,g,b,a)"
                onChange={(e) =>
                  this.setState({ pendingSearchCustomColor: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const hex = parseColorInput(
                      this.state.pendingSearchCustomColor
                    );
                    if (hex) this.setState({ pendingSearchCustomColor: hex });
                  }
                }}
                onBlur={() => {
                  const hex = parseColorInput(
                    this.state.pendingSearchCustomColor
                  );
                  if (hex) this.setState({ pendingSearchCustomColor: hex });
                }}
              />
              <span
                className="change-location-button"
                onClick={this.handleConfirmSearchCustomColor}
                style={{ marginBottom: "10px" }}
              >
                <Trans>Confirm</Trans>
              </span>
            </div>
          </div>
        )}
      </>
    );
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
            value={
              ConfigService.getReaderConfig("systemFont") || "Built-in font"
            }
            onChange={(event) => {
              this.changeFont(event.target.value);
            }}
          >
            {this.state.fontOptions.map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {item.value === "Built-in font"
                  ? this.props.t(item.label)
                  : item.label}
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
              <HexColorPicker
                color={this.state.pendingCustomColor}
                onChange={this.handleCustomColor}
                style={{
                  margin: "10px 0",
                  animation: "fade-in 0.2s ease-in-out 0s 1",
                }}
              />
              <input
                className="color-input-box"
                style={{ marginBottom: 8 }}
                value={this.state.pendingCustomColor}
                placeholder="#rrggbb / rgba(r,g,b,a)"
                onChange={(e) =>
                  this.setState({ pendingCustomColor: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const hex = parseColorInput(this.state.pendingCustomColor);
                    if (hex) this.setState({ pendingCustomColor: hex });
                  }
                }}
                onBlur={() => {
                  const hex = parseColorInput(this.state.pendingCustomColor);
                  if (hex) this.setState({ pendingCustomColor: hex });
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
        {this.renderTtsHighlightSetting()}
        {this.renderSearchHighlightSetting()}
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
