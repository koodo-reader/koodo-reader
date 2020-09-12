//图书样式设置的下拉菜单页面
import React from "react";
import { dropdownList } from "../../utils/readerConfig";
import "./dropdownList.css";
import { Trans } from "react-i18next";
import { DropdownListProps, DropdownListState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
const isElectron = require("is-electron");
if (isElectron()) {
  const { ipcRenderer } = window.require("electron");
  dropdownList[0].option = ipcRenderer.sendSync("fonts-ready", "ping");
}

class DropdownList extends React.Component<
  DropdownListProps,
  DropdownListState
> {
  constructor(props: DropdownListProps) {
    super(props);
    this.state = {
      currentFontFamilyIndex: dropdownList[0].option.findIndex((item: any) => {
        return item === (OtherUtil.getReaderConfig("fontFamily") || "Arial");
      }),
      currentLineHeightIndex: dropdownList[1].option.findIndex((item: any) => {
        return item === (OtherUtil.getReaderConfig("lineHeight") || "1.25");
      }),
    };
  }
  componentDidMount() {
    //使下拉菜单选中预设的值
    document
      .querySelector(".paragraph-character-setting")!
      .children[0].children[1].children[
        this.state.currentFontFamilyIndex === -1
          ? 0
          : this.state.currentFontFamilyIndex
      ].setAttribute("selected", "selected");

    document
      .querySelector(".paragraph-character-setting")!
      .children[1].children[1].children[
        this.state.currentLineHeightIndex
      ].setAttribute("selected", "selected");
  }
  //切换不同的样式
  handleView(event: any, option: string) {
    let arr = event.target.value.split(",");
    OtherUtil.setReaderConfig(option, arr[0]);
    switch (option) {
      case "fontFamily":
        this.setState({
          currentFontFamilyIndex: arr[1],
        });
        this.props.currentEpub.rendition.themes.default({
          "a, article, cite, code, div, li, p, pre, span, table": {
            "font-family": `${arr[0] || "Helvetica"} !important`,
          },
        });
        break;

      case "lineHeight":
        this.setState({
          currentLineHeightIndex: arr[1],
        });
        this.props.currentEpub.rendition.themes.default({
          "a, article, cite, code, div, li, p, pre, span, table": {
            "line-height": `${arr[0] || "1.25"} !important`,
          },
        });
        break;

      default:
        break;
    }
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
            {item.option.map((subItem: string, index: number) => (
              <option
                value={[subItem, index.toString()]}
                className="general-setting-option"
                key={index}
              >
                {subItem}
              </option>
            ))}
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
