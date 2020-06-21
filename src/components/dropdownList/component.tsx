//图书样式设置的下拉菜单页面
import React from "react";
import ReaderConfig from "../../utils/readerConfig";
import { dropdownList } from "../../utils/readerConfig";
import "./dropdownList.css";
import { Trans } from "react-i18next";
import { DropdownListProps, DropdownListState } from "./interface";
class DropdownList extends React.Component<
  DropdownListProps,
  DropdownListState
> {
  constructor(props: DropdownListProps) {
    super(props);
    this.state = {
      currentFontFamilyIndex: dropdownList[0].option.findIndex((item) => {
        return (
          item.value === (localStorage.getItem("fontFamily") || "Helvetica")
        );
      }),
      currentLineHeightIndex: dropdownList[1].option.findIndex((item) => {
        return item.value === (localStorage.getItem("lineHeight") || "1.25");
      }),
    };
  }
  componentDidMount() {
    //使下拉菜单选中预设的值
    document
      .querySelector(".paragraph-character-setting")!
      .children[0].children[1].children[
        this.state.currentFontFamilyIndex
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
    localStorage.setItem(option, arr[0]);
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

      default:
        break;
    }
    ReaderConfig.addDefaultCss();
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
            {item.option.map((subItem, index) => (
              <option
                value={[subItem.value, index.toString()]}
                className="general-setting-option"
                key={subItem.id}
              >
                {subItem.name}
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
