import React from "react";
import { dropdownList } from "../../../constants/dropdownList";
import "./dropdownList.css";
import { Trans } from "react-i18next";
import { DropdownListProps, DropdownListState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { loadFontData } from "../../../utils/common";
declare var window: any;
class DropdownList extends React.Component<
  DropdownListProps,
  DropdownListState
> {
  constructor(props: DropdownListProps) {
    super(props);
    this.state = {
      currentFontFamilyIndex: dropdownList[0].option.findIndex((item: any) => {
        return (
          item ===
          (ConfigService.getReaderConfig("fontFamily") || "Built-in font")
        );
      }),
      currentLineHeightIndex: dropdownList[1].option.findIndex((item: any) => {
        return (
          item === (ConfigService.getReaderConfig("lineHeight") || "Default")
        );
      }),
      currentTextAlignIndex: dropdownList[2].option.findIndex((item: any) => {
        return (
          item === (ConfigService.getReaderConfig("textAlign") || "Default")
        );
      }),
      chineseConversionIndex: dropdownList[3].option.findIndex((item: any) => {
        return (
          item ===
          (ConfigService.getReaderConfig("convertChinese") || "Default")
        );
      }),
    };
  }
  componentDidMount() {
    loadFontData().then((result) => {
      if (!result || result.length === 0) return;
      dropdownList[0].option = dropdownList[0].option.concat(result);
      this.setState({
        currentFontFamilyIndex: dropdownList[0].option.findIndex(
          (item: any) => {
            return (
              item.value ===
              (ConfigService.getReaderConfig("fontFamily") || "Built-in font")
            );
          }
        ),
      });
    });
  }

  handleView(event: any, option: string) {
    let arr = event.target.value.split(",");
    ConfigService.setReaderConfig(option, arr[0]);
    switch (option) {
      case "fontFamily":
        this.setState({
          currentFontFamilyIndex: arr[1],
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
          currentLineHeightIndex: arr[1],
        });

        break;
      case "textAlign":
        this.setState({
          currentTextAlignIndex: arr[1],
        });

        break;
      case "convertChinese":
        this.setState({
          chineseConversionIndex: arr[1],
        });

        break;
      default:
        break;
    }
    this.props.renderBookFunc();
  }
  render() {
    const renderParagraphCharacter = () => {
      return dropdownList.map((item) => (
        <li className="paragraph-character-container" key={item.id}>
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
                  value={[subItem.value, index.toString()]}
                  key={index}
                  className="general-setting-option"
                  selected={
                    index ===
                    (item.value === "lineHeight"
                      ? this.state.currentLineHeightIndex
                      : item.value === "textAlign"
                      ? this.state.currentTextAlignIndex
                      : item.value === "convertChinese"
                      ? this.state.chineseConversionIndex
                      : this.state.currentFontFamilyIndex)
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
