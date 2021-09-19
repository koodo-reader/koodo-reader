import React from "react";
import { Trans } from "react-i18next";
import { SliderListProps, SliderListState } from "./interface";
import "./sliderList.css";
import OtherUtil from "../../../utils/otherUtil";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
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
          : this.props.mode === "paraSpacing"
          ? OtherUtil.getReaderConfig("paraSpacing") || "0"
          : this.props.mode === "brightness"
          ? OtherUtil.getReaderConfig("brightness") || "1"
          : OtherUtil.getReaderConfig("margin") || "60",
    };
  }
  handleRest = () => {
    if (this.props.mode === "scale" || this.props.mode === "margin") {
      if (isElectron) {
        toast(this.props.t("Take effect at next startup"));
      } else {
        window.location.reload();
      }
      return;
    }
    this.props.renderFunc();
  };
  onValueChange = (event: any) => {
    if (this.props.mode === "fontSize") {
      const fontSize = event.target.value;
      this.setState({ value: fontSize });
      OtherUtil.setReaderConfig("fontSize", fontSize);
    } else if (this.props.mode === "scale") {
      const scale = event.target.value;
      this.setState({ value: scale });
      OtherUtil.setReaderConfig("scale", scale);
    } else if (this.props.mode === "letterSpacing") {
      const letterSpacing = event.target.value;
      this.setState({ value: letterSpacing });
      OtherUtil.setReaderConfig("letterSpacing", letterSpacing);
    } else if (this.props.mode === "paraSpacing") {
      const paraSpacing = event.target.value;
      this.setState({ value: paraSpacing });
      OtherUtil.setReaderConfig("paraSpacing", paraSpacing);
    } else if (this.props.mode === "brightness") {
      const brightness = event.target.value;
      this.setState({ value: brightness });
      OtherUtil.setReaderConfig("brightness", brightness);
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
          <Trans>{this.props.title}</Trans>
          <input
            className="input-value"
            defaultValue={this.state.value}
            type="number"
            step={
              this.props.title === "Scale" || this.props.title === "Brightness"
                ? "0.1"
                : "1"
            }
            onBlur={(event) => {
              this.onValueChange(event);
              this.handleRest();
            }}
          />
          <span style={{ marginLeft: "10px" }}>{this.state.value}</span>
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
              this.handleRest();
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
