import { useTranslation } from "react-i18next";
import { Fragment, useEffect, useState } from "react";
import { dropdownList } from "../../../constants/dropdownList";
import "./dropdownList.css";
import { Trans } from "react-i18next";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import FontUtil from "../../../utils/file/fontUtil";
import toast from "react-hot-toast";
import { isReadingRawPDF } from "../../../utils/common";
import { useAppStore } from "../../../store/useAppStore";

export interface DropdownListProps {
  group?: string;
}

declare var window: any;
const DropdownList = (props: DropdownListProps) => {
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const handleTextOrientation = useAppStore((s) => s.handleTextOrientation);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const { t } = useTranslation();
  const [state, setState] = useState<Record<string, any>>({
    currentFontFamilyValue:
      ConfigService.getReaderConfig("fontFamily") || "Built-in font",
    currentSubFontFamilyValue:
      ConfigService.getReaderConfig("subFontFamily") || "Built-in font",
    currentLineHeightValue: ConfigService.getReaderConfig("lineHeight") || "",
    currentTextAlignValue: ConfigService.getReaderConfig("textAlign") || "",
    chineseConversionValue:
      ConfigService.getReaderConfig("convertChinese") || "",
    currentAnimationValue: ConfigService.getReaderConfig("animation") || "none",
    currentBookLayoutValue: ConfigService.getReaderConfig("bookLayout") || "",
    currentCodeHighlighterValue:
      ConfigService.getReaderConfig("codeHighlight") || "",
    fontOptions: [],
    currentTextOrientationValue:
      ConfigService.getReaderConfig("textOrientation") || "",
    currentSelectActionValue:
      ConfigService.getReaderConfig("selectAction") || "",
    currentTxtParserValue:
      ConfigService.getObjectConfig(currentBook?.key, "bookRules", {})
        ?.defaultTxtParser || "",
    txtParserOptions: [],
  });
  const updateState = (patch: Record<string, any>) =>
    setState((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    const customParserLabels: string[] =
      ConfigService.getAllListConfig("txtParserList") || [];
    const customParserOptions = customParserLabels.map((label) => ({
      label,
      value: label,
    }));
    updateState({
      txtParserOptions: [
        ...KookitConfig.ContentRegxConfig,
        ...customParserOptions,
      ],
    });
    loadMergedFonts();
    window.addEventListener("font-list-changed", loadMergedFonts);
    return () => {
      window.removeEventListener("font-list-changed", loadMergedFonts);
    };
  }, []);

  useEffect(() => {
    updateState({
      currentTxtParserValue:
        ConfigService.getObjectConfig(currentBook?.key, "bookRules", {})
          ?.defaultTxtParser || "",
    });
  }, [currentBook?.key]);

  const loadMergedFonts = async () => {
    const options = await FontUtil.getMergedFontOptions();
    updateState({
      fontOptions: options,
      currentFontFamilyValue:
        ConfigService.getReaderConfig("fontFamily") || "Built-in font",
      currentSubFontFamilyValue:
        ConfigService.getReaderConfig("subFontFamily") || "Built-in font",
    });
  };

  const handleView = (event: any, option: string) => {
    const value = event.target.value;
    ConfigService.setReaderConfig(option, value);
    let arr = [value];
    switch (option) {
      case "fontFamily":
        updateState({
          currentFontFamilyValue: arr[0],
        });
        if (arr[0] === "Built-in font") {
          ConfigService.setReaderConfig(option, "");
        }
        break;
      case "subFontFamily":
        updateState({
          currentSubFontFamilyValue: arr[0],
        });
        if (arr[0] === "Built-in font") {
          ConfigService.setReaderConfig(option, "");
        }
        break;

      case "lineHeight":
        updateState({
          currentLineHeightValue: arr[0],
        });

        break;
      case "textAlign":
        updateState({
          currentTextAlignValue: arr[0],
        });

        break;
      case "convertChinese":
        updateState({
          chineseConversionValue: arr[0],
        });

        break;
      case "animation":
        updateState({
          currentAnimationValue: arr[0],
        });

        break;
      case "bookLayout":
        updateState({
          currentBookLayoutValue: arr[0],
        });
        break;
      case "codeHighlight":
        updateState({
          currentCodeHighlighterValue: arr[0],
        });
        break;
      case "textOrientation":
        updateState({
          currentTextOrientationValue: arr[0],
        });
        handleTextOrientation(arr[0]);

        break;
      case "selectAction":
        updateState({
          currentSelectActionValue: arr[0],
        });
        toast.success(t("Setup successful"));
        return;
      case "txtParser": {
        updateState({ currentTxtParserValue: arr[0] });
        const rule = ConfigService.getObjectConfig(
          currentBook.key,
          "bookRules",
          {}
        );
        ConfigService.setObjectConfig(
          currentBook.key,
          { ...rule, defaultTxtParser: arr[0] },
          "bookRules"
        );
        toast.success(t("Setup successful"));
        renderBookFunc();
        return;
      }
      default:
        break;
    }
    renderBookFunc();
  };
  const isTxt = currentBook?.format?.toUpperCase() === "TXT";
  const isPDF = isReadingRawPDF(currentBook);
  const renderParagraphCharacter = () => {
    return dropdownList
      .filter((item) => {
        if (props.group && item.group !== props.group) {
          return false;
        }
        if (item.value === "fullTranslationMode") {
          return false;
        }
        if (isPDF) {
          return item.isPDF;
        }
        return true;
      })
      .map((item) => (
        <Fragment key={item.value}>
          <li className="paragraph-character-container">
            <p className="general-setting-title">
              <Trans>{item.title}</Trans>
            </p>
            <select
              name=""
              className="general-setting-dropdown"
              value={
                item.value === "lineHeight"
                  ? state.currentLineHeightValue
                  : item.value === "textAlign"
                    ? state.currentTextAlignValue
                    : item.value === "convertChinese"
                      ? state.chineseConversionValue
                      : item.value === "animation"
                        ? state.currentAnimationValue
                        : item.value === "bookLayout"
                          ? state.currentBookLayoutValue
                          : item.value === "codeHighlight"
                            ? state.currentCodeHighlighterValue
                            : item.value === "textOrientation"
                              ? state.currentTextOrientationValue
                              : item.value === "fontFamily"
                                ? state.currentFontFamilyValue
                                : item.value === "selectAction"
                                  ? state.currentSelectActionValue
                                  : state.currentSubFontFamilyValue
              }
              onChange={(event) => {
                handleView(event, item.value);
              }}
            >
              {(item.value === "fontFamily" || item.value === "subFontFamily"
                ? state.fontOptions
                : item.option
              ).map(
                (
                  subItem: {
                    label: string;
                    value: string;
                  },
                  index: number
                ) => (
                  <option
                    value={subItem.value}
                    key={index}
                    className="general-setting-option"
                  >
                    {item.value === "codeHighlight"
                      ? subItem.value === ""
                        ? t("Disable")
                        : subItem.label
                      : item.value === "fontFamily" ||
                          item.value === "subFontFamily"
                        ? subItem.value === "Built-in font"
                          ? t(subItem.label)
                          : subItem.label
                        : t(subItem.label)}
                  </option>
                )
              )}
            </select>
          </li>
        </Fragment>
      ));
  };
  return (
    <ul className="paragraph-character-setting">
      {renderParagraphCharacter()}
      {isTxt && props.group === "more" && (
        <li className="paragraph-character-container">
          <p className="general-setting-title">
            <Trans>TXT parser</Trans>
          </p>
          <select
            name=""
            className="general-setting-dropdown"
            value={state.currentTxtParserValue}
            onChange={(event) => {
              if (event.target.value === "add-parser") {
                handleSetting(true);
                handleSettingMode("chapter");
                return;
              }
              handleView(event, "txtParser");
            }}
          >
            {state.txtParserOptions.map((option, index) => (
              <option
                value={option.value}
                key={index}
                className="general-setting-option"
              >
                {t(option.label)}
              </option>
            ))}
            <option
              value="add-parser"
              key="add"
              className="general-setting-option"
            >
              {t("Add new parser")}
            </option>
          </select>
        </li>
      )}
    </ul>
  );
};

export default DropdownList;
