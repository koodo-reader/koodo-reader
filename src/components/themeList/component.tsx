//修改阅读器背景色
import React from "react";
import { themeList } from "../../constants/readerConfig";
import StyleUtil from "../../utils/styleUtil";
import "./themeList.css";
import { Trans } from "react-i18next";
import { ThemeListProps, ThemeListState } from "./interface";
import OtherUtil from "../../utils/otherUtil";

class ThemeList extends React.Component<ThemeListProps, ThemeListState> {
  constructor(props: ThemeListProps) {
    super(props);
    this.state = {
      currentBackgroundIndex: themeList.findIndex((item) => {
        return (
          item.theme ===
          (OtherUtil.getReaderConfig("theme") || "rgba(255,255,255,1)")
        );
      }),
    };
  }
  handleChangeColor(theme: string, index: number) {
    OtherUtil.setReaderConfig("theme", theme);
    this.setState({
      currentBackgroundIndex: index,
    });
    if (index === 4) {
      this.props.currentEpub.rendition.themes.default({
        "a, article, cite, code, div, li, p, pre, span, table": {
          color: `white !important`,
        },
      });
    } else {
      this.props.currentEpub.rendition.themes.default({
        "a, article, cite, code, div, li, p, pre, span, table": {
          color: `inherit !important`,
        },
      });
    }
    StyleUtil.addDefaultCss();
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
        <div className="background-color-text">
          <Trans>Background Color</Trans>
        </div>
        <ul className="background-color-list">{renderBackgroundColorList()}</ul>
      </div>
    );
  }
}

export default ThemeList;
