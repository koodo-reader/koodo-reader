import React from "react";
import { Trans } from "react-i18next";
import { SliderListProps, SliderListState } from "./interface";
import "./sliderList.css";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
class SliderList extends React.Component<SliderListProps, SliderListState> {
  constructor(props: SliderListProps) {
    super(props);
    this.state = {
      value:
        this.props.mode === "fontSize"
          ? StorageUtil.getReaderConfig("fontSize") || "17"
          : this.props.mode === "scale"
          ? StorageUtil.getReaderConfig("scale") || "1"
          : this.props.mode === "letterSpacing"
          ? StorageUtil.getReaderConfig("letterSpacing") || "0"
          : this.props.mode === "paraSpacing"
          ? StorageUtil.getReaderConfig("paraSpacing") || "0"
          : this.props.mode === "brightness"
          ? StorageUtil.getReaderConfig("brightness") || "1"
          : StorageUtil.getReaderConfig("margin") || "60",
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
      StorageUtil.setReaderConfig("fontSize", fontSize);
    } else if (this.props.mode === "scale") {
      const scale = event.target.value;
      this.setState({ value: scale });
      StorageUtil.setReaderConfig("scale", scale);
    } else if (this.props.mode === "letterSpacing") {
      const letterSpacing = event.target.value;
      this.setState({ value: letterSpacing });
      StorageUtil.setReaderConfig("letterSpacing", letterSpacing);
    } else if (this.props.mode === "paraSpacing") {
      const paraSpacing = event.target.value;
      this.setState({ value: paraSpacing });
      StorageUtil.setReaderConfig("paraSpacing", paraSpacing);
    } else if (this.props.mode === "brightness") {
      const brightness = event.target.value;
      this.setState({ value: brightness });
      StorageUtil.setReaderConfig("brightness", brightness);
    } else {
      const margin = event.target.value;
      this.setState({ value: margin });
      StorageUtil.setReaderConfig("margin", margin);
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
