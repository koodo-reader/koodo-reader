import React from "react";
import { themeList } from "../../utils/readerConfig";
import ReaderConfig from "../../utils/readerConfig";
import "./themeList.css";

export interface ThemeListProps {}

export interface ThemeListState {
  currentBackgroundIndex: number;
}

class ThemeList extends React.Component<ThemeListProps, ThemeListState> {
  constructor(props: ThemeListProps) {
    super(props);
    this.state = {
      currentBackgroundIndex: themeList.findIndex((item) => {
        return (
          item.theme ===
          (localStorage.getItem("theme") || "rgba(255,254,252,1)")
        );
      }),
    };
  }
  handleChangeColor(theme: string, index: number) {
    localStorage.setItem("theme", theme);
    this.setState({
      currentBackgroundIndex: index,
    });
    ReaderConfig.addDefaultCss();
  }
  render() {
    const renderBackgroundColorList = () => {
      return themeList.map((item, index) => {
        return (
          <li
            key={item.id}
            className={
              index === this.state.currentBackgroundIndex
                ? "active-color background-color-circle"
                : "background-color-circle"
            }
            onClick={() => {
              this.handleChangeColor(item.theme, index);
            }}
            style={{ backgroundColor: item.theme }}
          ></li>
        );
      });
    };
    return (
      <div className="background-color-setting">
        <div className="background-color-text">背景颜色</div>
        <ul className="background-color-list">{renderBackgroundColorList()}</ul>
      </div>
    );
  }
}

export default ThemeList;
