import React from "react";
import { dropdownList } from "../../../constants/dropdownList";
import "./dropdownList.css";
import { Trans } from "react-i18next";
import { DropdownListProps, DropdownListState } from "./interface";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import { loadFontData, vexComfirmAsync } from "../../../utils/common";
import toast from "react-hot-toast";
declare var window: any;
class DropdownList extends React.Component<
  DropdownListProps,
  DropdownListState
> {
  constructor(props: DropdownListProps) {
    super(props);
    this.state = {
      currentFontFamilyValue:
        ConfigService.getReaderConfig("fontFamily") || "Built-in font",
      currentSubFontFamilyValue:
        ConfigService.getReaderConfig("subFontFamily") || "Built-in font",
      currentLineHeightValue: ConfigService.getReaderConfig("lineHeight") || "",
      currentTextAlignValue: ConfigService.getReaderConfig("textAlign") || "",
      chineseConversionValue:
        ConfigService.getReaderConfig("convertChinese") || "",
      fullTranslationModeValue: ConfigService.getAllListConfig(
        "fullTranslationBooks"
      ).includes(props.currentBook?.key)
        ? ConfigService.getReaderConfig("fullTranslationMode") || ""
        : "",
      currentTextOrientationValue:
        ConfigService.getReaderConfig("textOrientation") || "",
      currentSelectActionValue:
        ConfigService.getReaderConfig("selectAction") || "",
      currentTxtParserValue:
        ConfigService.getObjectConfig(props.currentBook?.key, "bookRules", {})
          ?.defaultTxtParser || "",
      txtParserOptions: [],
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps: DropdownListProps) {
    if (nextProps.currentBook?.key !== this.props.currentBook?.key) {
      this.setState({
        fullTranslationModeValue: ConfigService.getAllListConfig(
          "fullTranslationBooks"
        ).includes(nextProps.currentBook?.key)
          ? ConfigService.getReaderConfig("fullTranslationMode") || ""
          : "",
        currentTxtParserValue:
          ConfigService.getObjectConfig(
            nextProps.currentBook?.key,
            "bookRules",
            {}
          )?.defaultTxtParser || "",
      });
    }
  }
  componentDidMount() {
    const customParserLabels: string[] =
      ConfigService.getAllListConfig("txtParserList") || [];
    const customParserOptions = customParserLabels.map((label) => ({
      label,
      value: label,
    }));
    this.setState({
      txtParserOptions: [
        ...KookitConfig.ContentRegxConfig,
        ...customParserOptions,
      ],
    });
    loadFontData().then((result) => {
      if (!result || result.length === 0) return;
      let fontFamilyItem = dropdownList.find(
        (item) => item.value === "fontFamily"
      );
      let subFontFamilyItem = dropdownList.find(
        (item) => item.value === "subFontFamily"
      );
      if (fontFamilyItem && fontFamilyItem.option.length <= 2) {
        fontFamilyItem.option = fontFamilyItem.option.concat(result);
      }
      if (subFontFamilyItem && subFontFamilyItem.option.length <= 2) {
        subFontFamilyItem.option = subFontFamilyItem.option.concat(result);
      }
      if (fontFamilyItem && subFontFamilyItem) {
        this.setState({
          currentFontFamilyValue:
            ConfigService.getReaderConfig("fontFamily") || "Built-in font",
          currentSubFontFamilyValue:
            ConfigService.getReaderConfig("subFontFamily") || "Built-in font",
        });
      }
    });
  }

  handleView(event: any, option: string) {
    const value = event.target.value;
    ConfigService.setReaderConfig(option, value);
    let arr = [value];
    switch (option) {
      case "fontFamily":
        this.setState({
          currentFontFamilyValue: arr[0],
        });
        if (arr[0] === "Built-in font") {
          ConfigService.setReaderConfig(option, "");
        }
        if (arr[0] === "Load local fonts") {
          vexComfirmAsync(
            this.props.t(
              "Please install local fonts to your machine and then restart the application"
            )
          );
          ConfigService.setReaderConfig(option, "");

          return;
        }

        break;
      case "subFontFamily":
        this.setState({
          currentSubFontFamilyValue: arr[0],
        });
        if (arr[0] === "Built-in font") {
          ConfigService.setReaderConfig(option, "");
        }
        if (arr[0] === "Load local fonts") {
          vexComfirmAsync(
            this.props.t(
              "Please install local fonts to your machine and then restart the application"
            )
          );
          ConfigService.setReaderConfig(option, "");

          return;
        }

        break;

      case "lineHeight":
        this.setState({
          currentLineHeightValue: arr[0],
        });

        break;
      case "textAlign":
        this.setState({
          currentTextAlignValue: arr[0],
        });

        break;
      case "convertChinese":
        this.setState({
          chineseConversionValue: arr[0],
        });

        break;
      case "fullTranslationMode":
        this.setState({
          fullTranslationModeValue: arr[0],
        });
        if (arr[0] === "no" || arr[0] === "") {
          ConfigService.deleteListConfig(
            this.props.currentBook.key,
            "fullTranslationBooks"
          );
        } else {
          if (!this.props.isAuthed) {
            this.setState({
              fullTranslationModeValue: "no",
            });
            toast(this.props.t("Please upgrade to Pro to use this feature"));
            this.props.handleSetting(true);
            this.props.handleSettingMode("account");
            ConfigService.setReaderConfig("fullTranslationMode", "no");
            return;
          }
          ConfigService.setListConfig(
            this.props.currentBook.key,
            "fullTranslationBooks"
          );
        }
        toast.success(this.props.t("Setup successful"));
        break;
      case "textOrientation":
        this.setState({
          currentTextOrientationValue: arr[0],
        });
        this.props.handleTextOrientation(arr[0]);
        if (arr[0] === "vertical") {
          this.props.handleHideBackground(true);
          ConfigService.setReaderConfig("isHideBackground", "yes");
        }

        break;
      case "selectAction":
        this.setState({
          currentSelectActionValue: arr[0],
        });
        toast.success(this.props.t("Setup successful"));
        return;
      case "txtParser": {
        this.setState({ currentTxtParserValue: arr[0] });
        const rule = ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "bookRules",
          {}
        );
        ConfigService.setObjectConfig(
          this.props.currentBook.key,
          { ...rule, defaultTxtParser: arr[0] },
          "bookRules"
        );
        toast.success(this.props.t("Setup successful"));
        this.props.renderBookFunc();
        return;
      }
      default:
        break;
    }
    this.props.renderBookFunc();
  }
  render() {
    const renderParagraphCharacter = () => {
      return dropdownList.map((item) => (
        <li className="paragraph-character-container" key={item.value}>
          <p className="general-setting-title">
            <Trans>{item.title}</Trans>
          </p>
          <select
            name=""
            className="general-setting-dropdown"
            value={
              item.value === "lineHeight"
                ? this.state.currentLineHeightValue
                : item.value === "textAlign"
                  ? this.state.currentTextAlignValue
                  : item.value === "convertChinese"
                    ? this.state.chineseConversionValue
                    : item.value === "fullTranslationMode"
                      ? this.state.fullTranslationModeValue
                      : item.value === "textOrientation"
                        ? this.state.currentTextOrientationValue
                        : item.value === "fontFamily"
                          ? this.state.currentFontFamilyValue
                          : item.value === "selectAction"
                            ? this.state.currentSelectActionValue
                            : this.state.currentSubFontFamilyValue
            }
            onChange={(event) => {
              this.handleView(event, item.value);
            }}
          >
            {item.option.map(
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
                  {this.props.t(subItem.label)}
                </option>
              )
            )}
          </select>
        </li>
      ));
    };

    const isTxt = this.props.currentBook?.format?.toUpperCase() === "TXT";

    return (
      <ul className="paragraph-character-setting">
        {renderParagraphCharacter()}
        {isTxt && (
          <li className="paragraph-character-container">
            <p className="general-setting-title">
              <Trans>TXT parser</Trans>
            </p>
            <select
              name=""
              className="general-setting-dropdown"
              value={this.state.currentTxtParserValue}
              onChange={(event) => {
                if (event.target.value === "add-parser") {
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("chapter");
                  return;
                }
                this.handleView(event, "txtParser");
              }}
            >
              {this.state.txtParserOptions.map((option, index) => (
                <option
                  value={option.value}
                  key={index}
                  className="general-setting-option"
                >
                  {this.props.t(option.label)}
                </option>
              ))}
              <option
                value="add-parser"
                key="add"
                className="general-setting-option"
              >
                {this.props.t("Add new parser")}
              </option>
            </select>
          </li>
        )}
      </ul>
    );
  }
}

export default DropdownList;
