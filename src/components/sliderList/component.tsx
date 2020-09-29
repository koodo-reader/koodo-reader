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
          : OtherUtil.getReaderConfig("scale") || "1",
    };
  }

  onValueChange = (event: any) => {
    if (this.props.mode === "fontSize") {
      const fontSize = event.target.value;
      this.setState({ value: fontSize });
      OtherUtil.setReaderConfig("fontSize", fontSize);
      this.props.currentEpub.rendition.themes.default({
        "a, article, cite, code, div, li, p, pre, span, table": {
          "font-size": `${fontSize || 17}px !important`,
        },
      });
    } else {
      const scale = event.target.value;
      this.setState({ value: scale });
      OtherUtil.setReaderConfig("scale", scale);
      this.props.handleMessage("Try refresh or restart");
      this.props.handleMessageBox(true);
    }
  };
  //使进度百分比随拖动实时变化
  onValueInput = (event: any) => {
    this.setState({ value: event.target.value });
  };
  render() {
    return (
      <div className="font-size-setting">
        <div className="font-size-title">
          {this.props.mode === "fontSize" ? (
            <>
              <Trans>Font Size</Trans>&nbsp;&nbsp; &nbsp;
              <span>{this.state.value}px</span>
            </>
          ) : (
            <>
              <Trans>Scale</Trans>&nbsp;&nbsp; &nbsp;
              <span>
                {parseInt((parseFloat(this.state.value) * 100).toString())}%
              </span>
            </>
          )}
        </div>

        <span
          className="ultra-small-size"
          style={
            this.props.mode === "fontSize"
              ? {}
              : { position: "relative", right: 7 }
          }
        >
          {this.props.mode === "fontSize" ? "A" : `0.5`}
        </span>
        <div className="font-size-selector">
          <input
            className="input-progress"
            defaultValue={this.state.value}
            type="range"
            max={this.props.maxValue}
            min={this.props.minValue}
            step={this.props.mode === "fontSize" ? "1" : "0.1"}
            onInput={(event) => {
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
          <span
            className="ultra-large-size"
            style={{ fontSize: "16px", left: 5 }}
          >
            1.5
          </span>
        )}
      </div>
    );
  }
}

export default SliderList;
