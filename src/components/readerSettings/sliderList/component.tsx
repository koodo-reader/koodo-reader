//字体大小选择页面
import React from "react";
import { Trans } from "react-i18next";
import { SliderListProps, SliderListState } from "./interface";
import "./sliderList.css";
import OtherUtil from "../../../utils/otherUtil";

class SliderList extends React.Component<SliderListProps, SliderListState> {
  constructor(props: SliderListProps) {
    super(props);
    this.state = {
      value:
        this.props.mode === "fontSize"
          ? OtherUtil.getReaderConfig("fontSize") || "17"
          : this.props.mode === "scale"
          ? OtherUtil.getReaderConfig("scale") || "1"
          : this.props.mode === "letterSpacing"
          ? OtherUtil.getReaderConfig("letterSpacing") || "0"
          : OtherUtil.getReaderConfig("margin") || "50",
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
    } else if (this.props.mode === "scale") {
      const scale = event.target.value;
      this.setState({ value: scale });
      OtherUtil.setReaderConfig("scale", scale);
    } else if (this.props.mode === "letterSpacing") {
      const letterSpacing = event.target.value;
      this.setState({ value: letterSpacing });
      OtherUtil.setReaderConfig("letterSpacing", letterSpacing);
    } else {
      const margin = event.target.value;
      this.setState({ value: margin });
      OtherUtil.setReaderConfig("margin", margin);
    }
  };
  //使进度百分比随拖动实时变化
  onValueInput = (event: any) => {
    this.setState({ value: event.target.value });
  };
  handleMinus = (step: number) => {
    this.setState({ value: parseFloat(this.state.value) - step + "" });
    this.onValueChange({
      target: { value: parseFloat(this.state.value) - step + "" },
    });
  };
  handleAdd = (step: number) => {
    this.setState({ value: parseFloat(this.state.value) + step + "" });
    this.onValueChange({
      target: { value: parseFloat(this.state.value) + step + "" },
    });
  };
  render() {
    return (
      <div className="font-size-setting">
        <div className="font-size-title">
          {this.props.mode === "fontSize" ? (
            <>
              <Trans>Font Size</Trans>&nbsp;
              <span
                className="icon-minus slide-icon"
                onClick={() => {
                  this.handleMinus(1);
                }}
              ></span>
              <span>{this.state.value}px</span>
              <span
                className="icon-add slide-icon"
                onClick={() => {
                  this.handleAdd(1);
                }}
              ></span>
            </>
          ) : this.props.mode === "scale" ? (
            <>
              <Trans>Scale</Trans>&nbsp;
              <span
                className="icon-minus slide-icon"
                onClick={() => {
                  this.handleMinus(0.01);
                }}
              ></span>
              <span>
                {parseInt((parseFloat(this.state.value) * 100).toString())}%
              </span>
              <span
                className="icon-add slide-icon"
                onClick={() => {
                  this.handleAdd(0.01);
                }}
              ></span>
            </>
          ) : this.props.mode === "letterSpacing" ? (
            <>
              <Trans>Letter Spacing</Trans>&nbsp;
              <span
                className="icon-minus slide-icon"
                onClick={() => {
                  this.handleMinus(1);
                }}
              ></span>
              <span>{this.state.value}px</span>
              <span
                className="icon-add slide-icon"
                onClick={() => {
                  this.handleAdd(1);
                }}
              ></span>
            </>
          ) : (
            <>
              <Trans>Margin</Trans>&nbsp;
              <span
                className="icon-minus slide-icon"
                onClick={() => {
                  this.handleMinus(1);
                }}
              ></span>
              <span>{this.state.value}px</span>
              <span
                className="icon-add slide-icon"
                onClick={() => {
                  this.handleAdd(1);
                }}
              ></span>
            </>
          )}
        </div>

        <span className="ultra-small-size">{this.props.minLabel}</span>
        <div className="font-size-selector">
          <input
            className="input-progress"
            defaultValue={this.state.value}
            type="range"
            max={this.props.maxValue}
            min={this.props.minValue}
            step={this.props.step}
            onInput={(event) => {
              this.onValueChange(event);
            }}
            onChange={(event) => {
              this.onValueInput(event);
            }}
            onMouseUp={() => {
              this.props.mode !== "fontSize" && window.location.reload();
            }}
          />
        </div>
        {
          <span
            className="ultra-large-size"
            style={{ fontSize: "16px", right: "5px" }}
          >
            {this.props.maxLabel}
          </span>
        }
      </div>
    );
  }
}

export default SliderList;
