//字体大小选择页面
import React from "react";
import { Trans } from "react-i18next";
import { SliderListProps, SliderListState } from "./interface";
import "./sliderList.css";
import OtherUtil from "../../utils/otherUtil";

class SliderList extends React.Component<SliderListProps, SliderListState> {
  constructor(props: SliderListProps) {
    super(props);
    this.state = {
      value:
        this.props.mode === "fontSize"
          ? OtherUtil.getReaderConfig("fontSize") || "17"
          : OtherUtil.getReaderConfig("margin") || "100",
    };
  }

  onValueChange = (event: any) => {
    const fontSize = event.target.value;
    OtherUtil.setReaderConfig("fontSize", fontSize);
    this.props.currentEpub.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-size": `${fontSize || 17}px !important`,
      },
    });
  };
  //使进度百分比随拖动实时变化
  onValueInput = (event: any) => {
    this.setState({ value: event.target.value });
  };
  render() {
    return (
      <div className="font-size-setting">
        <div className="font-size-title">
          <Trans>Font Size</Trans>
        </div>
        <span className="ultra-small-size">
          {this.props.mode === "fontSize" ? "A" : `${this.props.minValue}%`}
        </span>
        <div className="font-size-selector">
          <input
            className="input-progress"
            defaultValue={this.state.value}
            type="range"
            max={this.props.maxValue}
            min={this.props.minValue}
            step="1"
            onMouseUp={(event) => {
              this.onValueChange(event);
            }}
            onChange={(event) => {
              this.onValueInput(event);
            }}
          />
        </div>
        {this.props.mode === "fontSize" ? (
          <span className="ultra-large-size">A</span>
        ) : (
          <span className="ultra-small-size">{`${this.props.maxValue}%`}</span>
        )}
        <div
          style={
            this.props.mode === "fontSize"
              ? { fontSize: `${this.state.value}px` }
              : {}
          }
          className="font-size-demo"
        >
          {this.props.mode === "fontSize"
            ? `${this.state.value}px`
            : `${this.state.value}%`}
        </div>
      </div>
    );
  }
}

export default SliderList;
