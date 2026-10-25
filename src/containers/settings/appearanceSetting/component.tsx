import { useTranslation } from "react-i18next";
import React, { useEffect, useReducer, useRef, useState } from "react";
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
import SwitchRow from "../../../components/readerSettings/switchRow";
import FontUtil from "../../../utils/file/fontUtil";
import {
  applyCustomSystemCSS,
  applyCustomSystemFont,
  syncNativeThemeSource,
} from "../../../utils/reader/launchUtil";

const AppearanceSetting = () => {
  const { t } = useTranslation();
  const highlightUtilRef = useRef<any>(null);
  if (!highlightUtilRef.current) {
    highlightUtilRef.current = new HighlightUtil(ConfigService);
  }
  const highlightUtil = highlightUtilRef.current;

  const [state, setState] = useState<SettingInfoState>(() => {
    const ttsHighlight = highlightUtil.getTtsHighlightValue();
    const searchHighlight = highlightUtil.getSearchHighlightValue();
    return {
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
      searchHighlightStyleType: searchHighlight.styleType,
      searchHighlightColor: searchHighlight.color,
    };
  });

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const loadFont = async () => {
    const options = await FontUtil.getMergedFontOptions();
    setState((prevState) => ({
      ...prevState,
      fontOptions: options,
      fontListVersion: prevState.fontListVersion + 1,
    }));
  };

  useEffect(() => {
    loadFont();
    window.addEventListener("font-list-changed", loadFont);
    return () => {
      window.removeEventListener("font-list-changed", loadFont);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRest = (_bool: boolean) => {
    toast.success(t("Change successful"));
  };

  const handleSetting = (stateName: string) => {
    const nextValue = !(state as any)[stateName];
    setState((prevState) => ({ ...prevState, [stateName]: nextValue } as any));
    ConfigService.setReaderConfig(stateName, nextValue ? "yes" : "no");
    handleRest(nextValue);
  };

  const changeSkin = (skin: string) => {
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

  const changeFont = async (font: string) => {
    ConfigService.setReaderConfig(
      "systemFont",
      font === "Built-in font" ? "" : font
    );
    await applyCustomSystemFont();
    forceUpdate();
  };

  const handleTheme = (color: string, index: number) => {
    setState((prevState) => ({
      ...prevState,
      currentThemeIndex: index,
      isShowCustomColorPicker: false,
    }));
    ConfigService.setReaderConfig("themeColor", color);
    reloadManager();
  };

  const handleCustomColor = (color: string) => {
    setState((prevState) => ({
      ...prevState,
      pendingCustomColor: color,
    }));
  };

  const handleConfirmCustomColor = () => {
    const color = state.pendingCustomColor;
    setState((prevState) => ({
      ...prevState,
      customColor: color,
      currentThemeIndex: -1,
      isShowCustomColorPicker: false,
    }));
    ConfigService.setReaderConfig("themeColor", color);
    reloadManager();
  };

  const handleTtsStyleType = (styleType: string) => {
    const color = KookitConfig.HighlightPresetColors[styleType][0];
    setState((prevState) => ({
      ...prevState,
      ttsHighlightStyleType: styleType,
      ttsHighlightColor: color,
    }));
    highlightUtil.saveTtsHighlightValue({ styleType, color });
  };

  const handleTtsPresetColor = (index: number) => {
    const styleType = state.ttsHighlightStyleType;
    const color = KookitConfig.HighlightPresetColors[styleType][index];
    setState((prevState) => ({
      ...prevState,
      ttsHighlightColor: color,
    }));
    highlightUtil.saveTtsHighlightValue({ styleType, color });
  };

  const handleSearchStyleType = (styleType: string) => {
    const color = KookitConfig.HighlightPresetColors[styleType][0];
    setState((prevState) => ({
      ...prevState,
      searchHighlightStyleType: styleType,
      searchHighlightColor: color,
    }));
    highlightUtil.saveSearchHighlightValue({ styleType, color });
  };

  const handleSearchPresetColor = (index: number) => {
    const styleType = state.searchHighlightStyleType;
    const color = KookitConfig.HighlightPresetColors[styleType][index];
    setState((prevState) => ({
      ...prevState,
      searchHighlightColor: color,
    }));
    highlightUtil.saveSearchHighlightValue({ styleType, color });
  };

  const renderTtsHighlightSetting = () => {
    const styleType = state.ttsHighlightStyleType;
    const currentColor = state.ttsHighlightColor;
    const presetColors = KookitConfig.HighlightPresetColors[styleType];

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
                onClick={() => handleTtsStyleType(item.value)}
              >
                <span
                  className="tts-highlight-style-preview"
                  style={highlightUtil.buildTtsHighlightPreviewStyle(
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
                presetColors.indexOf(currentColor) === index
                  ? "tts-highlight-color-item active-tts-highlight-color"
                  : "tts-highlight-color-item"
              }
              style={{ backgroundColor: color }}
              onClick={() => handleTtsPresetColor(index)}
            />
          ))}
        </ul>
      </>
    );
  };

  const renderSearchHighlightSetting = () => {
    const styleType = state.searchHighlightStyleType;
    const currentColor = state.searchHighlightColor;
    const presetColors = KookitConfig.HighlightPresetColors[styleType];

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
                onClick={() => handleSearchStyleType(item.value)}
              >
                <span
                  className="tts-highlight-style-preview"
                  style={highlightUtil.buildSearchHighlightPreviewStyle(
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
                presetColors.indexOf(currentColor) === index
                  ? "tts-highlight-color-item active-tts-highlight-color"
                  : "tts-highlight-color-item"
              }
              style={{ backgroundColor: color }}
              onClick={() => handleSearchPresetColor(index)}
            />
          ))}
        </ul>
      </>
    );
  };

  const renderSwitchOption = (optionList: any[]) => {
    return optionList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <SwitchRow
            variant="setting"
            title={<Trans>{item.title}</Trans>}
            isEnabled={(state as any)[item.propName]}
            onClick={() => {
              handleSetting(item.propName);
            }}
          />
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };

  return (
    <>
      {renderSwitchOption(appearanceSettingList)}
      <div className="setting-dialog-new-title">
        <Trans>System font</Trans>
        <select
          name=""
          className="lang-setting-dropdown"
          value={ConfigService.getReaderConfig("systemFont") || "Built-in font"}
          onChange={(event) => {
            changeFont(event.target.value);
          }}
        >
          {state.fontOptions.map((item) => (
            <option
              value={item.value}
              key={item.value}
              className="lang-setting-option"
            >
              {item.value === "Built-in font"
                ? t(item.label)
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
              index === state.currentThemeIndex
                ? "theme-setting-item active-theme-item"
                : "theme-setting-item"
            }
            key={item.color}
            onClick={() => {
              handleTheme(item.color, index);
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
            state.currentThemeIndex === -1
              ? "theme-setting-item active-theme-item"
              : "theme-setting-item"
          }
          onClick={() => {
            setState((prevState) => ({
              ...prevState,
              isShowCustomColorPicker: !state.isShowCustomColorPicker,
              pendingCustomColor: state.customColor,
            }));
          }}
          style={{ color: state.customColor }}
        >
          <span
            className="theme-setting-dot"
            style={{
              backgroundColor:
                state.currentThemeIndex === -1 ? state.customColor : undefined,
            }}
          >
            <span
              className={
                state.isShowCustomColorPicker ? "icon-check" : "icon-more"
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
      {state.isShowCustomColorPicker && (
        <div className="custom-color-picker-container">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <HexColorPicker
              color={state.pendingCustomColor}
              onChange={handleCustomColor}
              style={{
                margin: "10px 0",
                animation: "fade-in 0.2s ease-in-out 0s 1",
              }}
            />
            <input
              className="color-input-box"
              style={{ marginBottom: 8 }}
              value={state.pendingCustomColor}
              placeholder="#rrggbb / rgba(r,g,b,a)"
              onChange={(e) =>
                setState((prevState) => ({
                  ...prevState,
                  pendingCustomColor: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const hex = parseColorInput(state.pendingCustomColor);
                  if (hex)
                    setState((prevState) => ({
                      ...prevState,
                      pendingCustomColor: hex,
                    }));
                }
              }}
              onBlur={() => {
                const hex = parseColorInput(state.pendingCustomColor);
                if (hex)
                  setState((prevState) => ({
                    ...prevState,
                    pendingCustomColor: hex,
                  }));
              }}
            />
            <span
              className="change-location-button"
              onClick={handleConfirmCustomColor}
              style={{ marginBottom: "10px" }}
            >
              <Trans>Confirm</Trans>
            </span>
          </div>
        </div>
      )}
      {renderTtsHighlightSetting()}
      {renderSearchHighlightSetting()}
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
              changeSkin(item.value);
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
      <SwitchRow
        variant="setting"
        title={<Trans>Custom app style</Trans>}
        isEnabled={state.isCustomSystemCSS}
        onClick={() => {
          const next = !state.isCustomSystemCSS;
          setState((prevState) => ({
            ...prevState,
            isCustomSystemCSS: next,
          }));
          ConfigService.setReaderConfig(
            "isCustomSystemCSS",
            next ? "yes" : "no"
          );
          if (!state.customSystemCSS) {
            return;
          }
          applyCustomSystemCSS();
          handleRest(next);
        }}
      />
      <p className="setting-option-subtitle">
        <Trans>
          Customize the appearance of the entire application with CSS
        </Trans>
      </p>
      {state.isCustomSystemCSS && (
        <div style={{ margin: "10px 25px" }}>
          <textarea
            className="token-dialog-token-box"
            placeholder={"/* " + t("Enter custom CSS here") + " */"}
            value={state.customSystemCSS}
            onChange={(e) => {
              setState((prevState) => ({
                ...prevState,
                customSystemCSS: e.target.value,
              }));
            }}
            onBlur={() => {
              ConfigService.setReaderConfig(
                "customSystemCSS",
                state.customSystemCSS
              );
              applyCustomSystemCSS();
              handleRest(true);
            }}
          />
        </div>
      )}
    </>
  );
};

export default AppearanceSetting;
