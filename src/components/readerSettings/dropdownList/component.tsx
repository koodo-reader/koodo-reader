import React from "react";
import { dropdownList } from "../../../constants/dropdownList";
import "./dropdownList.css";
import { Trans } from "react-i18next";
import { DropdownListProps, DropdownListState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { loadFontData } from "../../../utils/common";
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
      currentTextOrientationValue:
        ConfigService.getReaderConfig("textOrientation") || "",
    };
  }
  componentDidMount() {
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
          loadFontData();
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
          loadFontData();
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
                  selected={
                    subItem.value ===
                    (item.value === "lineHeight"
                      ? this.state.currentLineHeightValue
                      : item.value === "textAlign"
                        ? this.state.currentTextAlignValue
                        : item.value === "convertChinese"
                          ? this.state.chineseConversionValue
                          : item.value === "textOrientation"
                            ? this.state.currentTextOrientationValue
                            : item.value === "fontFamily"
                              ? this.state.currentFontFamilyValue
                              : this.state.currentSubFontFamilyValue)
                  }
                >
                  {this.props.t(subItem.label)}
                </option>
              )
            )}
          </select>
        </li>
      ));
    };

    return (
      <ul className="paragraph-character-setting">
        {renderParagraphCharacter()}
      </ul>
    );
  }
}

export default DropdownList;
