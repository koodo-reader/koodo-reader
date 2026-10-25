import { useTranslation } from "react-i18next";
import React, { useReducer, useState } from "react";
import { backgroundList, textList } from "../../../constants/themeList";
import "./themeList.css";
import { Trans } from "react-i18next";
import { ThemeListProps, ThemeListState } from "./interface";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import { HexColorPicker } from "react-colorful";
import toast from "react-hot-toast";
import { normalizePickerColor, parseColorInput } from "../../../utils/common";
import { useAppStore } from "../../../store/useAppStore";

const ThemeList = () => {
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleBackgroundColor = useAppStore((s) => s.handleBackgroundColor);
  const { t } = useTranslation();
  const [state, setState] = useState<ThemeListState>(() => ({
    currentBackgroundIndex: backgroundList
      .concat(ConfigService.getAllListConfig("themeColors"))
      .findIndex((item) => {
        return (
          item ===
          (ConfigService.getReaderConfig("backgroundColor") ||
            "rgba(255,255,255,1)")
        );
      }),
    currentTextIndex: textList
      .concat(ConfigService.getAllListConfig("themeColors"))
      .findIndex((item) => {
        return (
          item ===
          (ConfigService.getReaderConfig("textColor") || "rgba(0,0,0,1)")
        );
      }),
    isShowTextPicker: false,
    isShowBgPicker: false,
    bgColorInput: normalizePickerColor(
      ConfigService.getReaderConfig("backgroundColor"),
      "#ffffff"
    ),
    textColorInput: normalizePickerColor(
      ConfigService.getReaderConfig("textColor"),
      "#000000"
    ),
    pendingBgColor: normalizePickerColor(
      ConfigService.getReaderConfig("backgroundColor"),
      "#ffffff"
    ),
    pendingTextColor: normalizePickerColor(
      ConfigService.getReaderConfig("textColor"),
      "#000000"
    ),
  }));
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const updateState = (patch: Partial<ThemeListState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const getPresetIndex = (backgroundColor: string, textColor: string) => {
    return KookitConfig.PresetThemeList.findIndex((item) => {
      return (
        item.backgroundColor === backgroundColor && item.textColor === textColor
      );
    });
  };

  const handleChangeBgColor = (color: string, index: number = -1) => {
    ConfigService.setReaderConfig("backgroundColor", color);
    handleBackgroundColor(color);
    updateState({
      currentBackgroundIndex: index,
    });
    if (index === 1) {
      ConfigService.setReaderConfig("textColor", "rgba(255,255,255,1)");
    } else if (
      index === 0 &&
      ConfigService.getReaderConfig("backgroundColor") === "rgba(255,255,255,1)"
    ) {
      ConfigService.setReaderConfig("textColor", "rgba(0,0,0,1)");
    }
    renderBookFunc();
  };

  const handlePreviewBgColor = (color: string) => {
    updateState({ bgColorInput: color, pendingBgColor: color });
  };
  const handlePreviewTextColor = (color: string) => {
    updateState({ textColorInput: color, pendingTextColor: color });
  };
  const handleColorTextPicker = (isShowTextPicker: boolean) => {
    if (!isShowTextPicker) {
      const pendingHex = state.pendingTextColor;
      const exists = textList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .some((item) => normalizePickerColor(item, "#000000") === pendingHex);
      if (!exists) {
        ConfigService.setListConfig(pendingHex, "themeColors");
      }
      const appliedColor =
        ConfigService.getReaderConfig("textColor") || "rgba(0,0,0,1)";
      updateState({
        currentTextIndex: textList
          .concat(ConfigService.getAllListConfig("themeColors"))
          .indexOf(appliedColor),
      });
    } else {
      const current = normalizePickerColor(
        ConfigService.getReaderConfig("textColor"),
        "#000000"
      );
      updateState({
        pendingTextColor: current,
        textColorInput: current,
      });
    }
    updateState({ isShowTextPicker });
  };
  const handleColorBgPicker = (isShowBgPicker: boolean) => {
    if (!isShowBgPicker) {
      const pendingHex = state.pendingBgColor;
      const exists = backgroundList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .some((item) => normalizePickerColor(item, "#ffffff") === pendingHex);
      if (!exists) {
        ConfigService.setListConfig(pendingHex, "themeColors");
      }
      const appliedColor =
        ConfigService.getReaderConfig("backgroundColor") ||
        "rgba(255,255,255,1)";
      updateState({
        currentBackgroundIndex: backgroundList
          .concat(ConfigService.getAllListConfig("themeColors"))
          .indexOf(appliedColor),
      });
    } else {
      const current = normalizePickerColor(
        ConfigService.getReaderConfig("backgroundColor"),
        "#ffffff"
      );
      updateState({
        pendingBgColor: current,
        bgColorInput: current,
      });
    }
    updateState({ isShowBgPicker });
  };
  const handleChooseTextColor = (color: string) => {
    updateState({
      currentTextIndex: textList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .indexOf(color),
      textColorInput: normalizePickerColor(color, "#000000"),
      pendingTextColor: normalizePickerColor(color, "#000000"),
    });
    ConfigService.setReaderConfig("textColor", color);
    renderBookFunc();
  };

  const handleChoosePreset = (preset: {
    textColor: string;
    backgroundColor: string;
  }) => {
    ConfigService.setReaderConfig("backgroundColor", preset.backgroundColor);
    ConfigService.setReaderConfig("textColor", preset.textColor);
    handleBackgroundColor(preset.backgroundColor);
    const bgIndex = backgroundList
      .concat(ConfigService.getAllListConfig("themeColors"))
      .indexOf(preset.backgroundColor);
    const textIndex = textList
      .concat(ConfigService.getAllListConfig("themeColors"))
      .indexOf(preset.textColor);
    updateState({
      currentBackgroundIndex: bgIndex,
      currentTextIndex: textIndex,
      bgColorInput: normalizePickerColor(preset.backgroundColor, "#ffffff"),
      textColorInput: normalizePickerColor(preset.textColor, "#000000"),
    });
    renderBookFunc();
  };

  const renderBackgroundColorList = () => {
    return backgroundList
      .concat(ConfigService.getAllListConfig("themeColors"))
      .map((item, index) => {
        return (
          <li
            key={item + index}
            className={
              index === state.currentBackgroundIndex
                ? "active-color background-color-circle"
                : "background-color-circle"
            }
            onClick={() => {
              handleChangeBgColor(item, index);
            }}
            style={{ backgroundColor: item }}
          >
            {index > 3 && (
              <span
                className="icon-close theme-color-delete theme-color-delete-hover theme-color-delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  ConfigService.deleteListConfig(item, "themeColors");
                  if (index === state.currentBackgroundIndex) {
                    handleChangeBgColor(backgroundList[0], 0);
                  } else {
                    forceUpdate();
                  }
                }}
              ></span>
            )}
          </li>
        );
      });
  };
  const renderTextColorList = () => {
    return textList
      .concat(ConfigService.getAllListConfig("themeColors"))
      .map((item, index) => {
        return (
          <li
            key={item + index}
            className={
              index === state.currentTextIndex
                ? "active-color background-color-circle"
                : "background-color-circle"
            }
            onClick={() => {
              handleChooseTextColor(item);
            }}
            style={{ backgroundColor: item }}
          >
            {index > 3 && (
              <span
                className="icon-close theme-color-delete theme-color-delete-hover"
                onClick={(e) => {
                  e.stopPropagation();
                  ConfigService.deleteListConfig(item, "themeColors");
                  if (index === state.currentTextIndex) {
                    handleChooseTextColor(textList[0]);
                  } else {
                    forceUpdate();
                  }
                }}
              ></span>
            )}
          </li>
        );
      });
  };

  return (
    <div className="background-color-setting">
      <div
        className="background-color-text"
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Trans>Background color</Trans>
        <span
          className="theme-color-clear-button"
          onClick={() => {
            ConfigService.setReaderConfig("backgroundColor", "");
            handleBackgroundColor("");
            toast.success(t("Removal successful"));
            renderBookFunc();
          }}
        >
          <Trans>Clear</Trans>{" "}
          <span className="icon-trash" style={{ fontSize: "13px" }}></span>
        </span>
      </div>
      <ul className="background-color-list">
        <li
          className="background-color-circle"
          onClick={() => {
            handleColorBgPicker(!state.isShowBgPicker);
          }}
        >
          <span
            className={state.isShowBgPicker ? "icon-check" : "icon-more"}
          ></span>
        </li>

        {renderBackgroundColorList()}
      </ul>
      {state.isShowBgPicker && (
        <div style={{ margin: "10px 20px", marginLeft: "30px" }}>
          <HexColorPicker
            color={state.pendingBgColor}
            onChange={handlePreviewBgColor}
            style={{
              marginBottom: 10,
              animation: "fade-in 0.2s ease-in-out 0s 1",
            }}
          />
          <input
            className="color-input-box"
            value={state.bgColorInput}
            placeholder="#rrggbb / rgba(r,g,b,a)"
            onChange={(e) => updateState({ bgColorInput: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const hex = parseColorInput(state.bgColorInput);
                if (hex) handlePreviewBgColor(hex);
              }
            }}
            onBlur={() => {
              const hex = parseColorInput(state.bgColorInput);
              if (hex) handlePreviewBgColor(hex);
              else
                updateState({
                  bgColorInput: state.pendingBgColor,
                });
            }}
          />
        </div>
      )}
      <div
        className="background-color-text"
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Trans>Text color</Trans>
        <span
          className="theme-color-clear-button"
          onClick={() => {
            ConfigService.setReaderConfig("textColor", "");
            toast.success(t("Removal successful"));
            renderBookFunc();
          }}
        >
          <Trans>Clear</Trans>{" "}
          <span className="icon-trash" style={{ fontSize: "13px" }}></span>
        </span>
      </div>
      <ul className="background-color-list">
        <li
          className="background-color-circle"
          onClick={() => {
            handleColorTextPicker(!state.isShowTextPicker);
          }}
        >
          <span
            className={state.isShowTextPicker ? "icon-check" : "icon-more"}
          ></span>
        </li>

        {renderTextColorList()}
      </ul>
      {state.isShowTextPicker && (
        <div style={{ margin: "10px 20px", marginLeft: "30px" }}>
          <HexColorPicker
            color={state.pendingTextColor}
            onChange={handlePreviewTextColor}
            style={{
              marginBottom: 10,
              animation: "fade-in 0.2s ease-in-out 0s 1",
            }}
          />
          <input
            className="color-input-box"
            value={state.textColorInput}
            placeholder="#rrggbb / rgba(r,g,b,a)"
            onChange={(e) => updateState({ textColorInput: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const hex = parseColorInput(state.textColorInput);
                if (hex) handlePreviewTextColor(hex);
              }
            }}
            onBlur={() => {
              const hex = parseColorInput(state.textColorInput);
              if (hex) handlePreviewTextColor(hex);
              else
                updateState({
                  textColorInput: state.pendingTextColor,
                });
            }}
          />
        </div>
      )}
      <div
        className="background-color-text"
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Trans>Theme</Trans>
      </div>
      <div className="preset-theme-list">
        {KookitConfig.PresetThemeList.map((item) => {
          return (
            <div
              key={item.key}
              className={"preset-theme-item"}
              style={{
                backgroundColor: item.backgroundColor,
                color: item.textColor,
                borderColor: item.textColor,
              }}
              onClick={() => {
                handleChoosePreset(item);
              }}
            >
              <span className="preset-theme-text">
                {(ConfigService.getReaderConfig("lang") || "").startsWith("zh")
                  ? t(item.title)
                  : "A"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeList;
