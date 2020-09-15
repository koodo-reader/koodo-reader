//字体大小选择页面
import React from "react";
import { fontSizeList } from "../../utils/readerConfig";
import ReaderConfig from "../../utils/readerConfig";
import { Trans } from "react-i18next";
import { FontSizeListProps, FontSizeListState } from "./interface";
import "./fontSizeList.css";
import OtherUtil from "../../utils/otherUtil";

class FontSizeList extends React.Component<
  FontSizeListProps,
  FontSizeListState
> {
  constructor(props: FontSizeListProps) {
    super(props);
    this.state = {
      currentFontSizeIndex: fontSizeList.findIndex((item) => {
        return item.value === (OtherUtil.getReaderConfig("fontSize") || "17");
      }),
    };
  }

  handleFontSize(value: string, index: number) {
    OtherUtil.setReaderConfig("fontSize", value);
    this.setState({
      currentFontSizeIndex: index,
    });
    ReaderConfig.addDefaultCss();
  }

  render() {
    const renderFontSizeDescription = () => {
      return fontSizeList.map((item, index) => {
        return (
          <li className="font-size-description" key={item.id}>
            <div
              className={
                index === this.state.currentFontSizeIndex
                  ? "active-font-size font-size-circle"
                  : "font-size-circle"
              }
              onClick={() => this.handleFontSize(item.value, index)}
            ></div>
            <p className="font-size-text">
              <Trans>{item.size}</Trans>
            </p>
          </li>
        );
      });
    };
    return (
      <div className="font-size-setting">
        <div className="font-size-title">
          <Trans>Font Size</Trans>
        </div>
        <span className="ultra-small-size">A</span>
        <div className="font-size-line"></div>
        <ul className="font-size-selector">{renderFontSizeDescription()}</ul>

        <span className="ultra-large-size">A</span>
      </div>
    );
  }
}

export default FontSizeList;
