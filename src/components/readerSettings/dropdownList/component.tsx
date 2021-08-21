//图书样式设置的下拉菜单页面
import React from "react";
import { dropdownList } from "../../../constants/dropdownList";
import "./dropdownList.css";
import { Trans } from "react-i18next";
import { DropdownListProps, DropdownListState } from "./interface";
import OtherUtil from "../../../utils/otherUtil";
import { isElectron } from "react-device-detect";
class DropdownList extends React.Component<
  DropdownListProps,
  DropdownListState
> {
  constructor(props: DropdownListProps) {
    super(props);
    this.state = {
      currentFontFamilyIndex: dropdownList[0].option.findIndex((item: any) => {
        return (
          item === (OtherUtil.getReaderConfig("fontFamily") || "Built-in font")
        );
      }),
      currentLineHeightIndex: dropdownList[1].option.findIndex((item: any) => {
        return item === (OtherUtil.getReaderConfig("lineHeight") || "1.25");
      }),
      currentTextAlignIndex: dropdownList[2].option.findIndex((item: any) => {
        return item === (OtherUtil.getReaderConfig("textAlign") || "left");
      }),
    };
  }
  componentDidMount() {
    //使下拉菜单选中预设的值
    if (
      isElectron &&
      navigator.appVersion.indexOf("NT 6.1") === -1 &&
      navigator.appVersion.indexOf("NT 5.1") === -1 &&
      navigator.appVersion.indexOf("NT 6.0") === -1
    ) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.invoke("fonts-ready", "ping").then((result) => {
        dropdownList[0].option = result;
        dropdownList[0].option.push("Built-in font");
      });
    }
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

    document
      .querySelector(".paragraph-character-setting")!
      .children[2].children[1].children[
        this.state.currentTextAlignIndex
      ].setAttribute("selected", "selected");
  }
  handleRest = () => {
    this.props.renderFunc();
  };
  //切换不同的样式
  handleView(event: any, option: string) {
    let arr = event.target.value.split(",");
    OtherUtil.setReaderConfig(option, arr[0]);
    switch (option) {
      case "fontFamily":
        this.setState({
          currentFontFamilyIndex: arr[1],
        });

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
      default:
        break;
    }
    this.handleRest();
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
                key={index}
                className="general-setting-option"
              >
                {this.props.t(subItem)}
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
