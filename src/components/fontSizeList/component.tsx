//字体大小选择页面
import React from "react";
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
      fontSize: OtherUtil.getReaderConfig("fontSize") || "17",
    };
  }

  onFontChange = (event: any) => {
    const fontSize = event.target.value;
    OtherUtil.setReaderConfig("fontSize", fontSize);
    this.props.currentEpub.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-size": `${fontSize || 17}px !important`,
      },
    });
  };
  //使进度百分比随拖动实时变化
  onFontInput = (event: any) => {
    this.setState({ fontSize: event.target.value });
  };
  render() {
    return (
      <div className="font-size-setting">
        <div className="font-size-title">
          <Trans>Font Size</Trans>
        </div>
        <span className="ultra-small-size">A</span>
        <div className="font-size-selector">
          <input
            className="input-progress"
            defaultValue={this.state.fontSize}
            type="range"
            max="30"
            min="15"
            step="1"
            onMouseUp={(event) => {
              this.onFontChange(event);
            }}
            onChange={(event) => {
              this.onFontInput(event);
            }}
          />
        </div>
        <span className="ultra-large-size">A</span>
        <div
          style={{ fontSize: `${this.state.fontSize}px` }}
          className="font-size-demo"
        >
          {this.state.fontSize}
        </div>
      </div>
    );
  }
}

export default FontSizeList;
