import React from "react";
import { Trans } from "react-i18next";
import { SliderListProps, SliderListState } from "./interface";
import "./sliderList.css";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { isElectron } from "react-device-detect";
class SliderList extends React.Component<SliderListProps, SliderListState> {
  constructor(props: SliderListProps) {
    super(props);
    this.state = {
      isTyping: false,
      inputValue: "",
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
          : StorageUtil.getReaderConfig("margin") || "0",
    };
  }
  handleRest = async () => {
    if (this.props.mode === "scale" || this.props.mode === "margin") {
      if (isElectron) {
        if (StorageUtil.getReaderConfig("isOpenInMain") === "yes") {
          window.require("electron").ipcRenderer.invoke("reload-main", "ping");
        } else {
          window
            .require("electron")
            .ipcRenderer.invoke("reload-reader", "ping");
        }
      } else {
        window.location.reload();
      }
      return;
    }
    this.props.renderBookFunc();
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
          <span style={{ marginRight: "10px" }}>
            <Trans>{this.props.title}</Trans>
          </span>

          <input
            className="input-value"
            value={
              this.state.isTyping ? this.state.inputValue : this.state.value
            }
            type="number"
            step={
              this.props.title === "Page Width" ||
              this.props.title === "Brightness"
                ? "0.1"
                : "1"
            }
            onChange={(event) => {
              let fieldVal = event.target.value;
              this.setState({ inputValue: fieldVal });
            }}
            onFocus={() => {
              this.setState({ isTyping: true });
            }}
            onBlur={(event) => {
              this.onValueChange(event);
              this.setState({ isTyping: false });
              this.handleRest();
            }}
          />
          <span style={{ marginLeft: "10px" }}>{this.state.value}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <span className="ultra-small-size">{this.props.minLabel}</span>
          <div className="font-size-selector">
            <input
              className="input-progress"
              value={this.state.value}
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
              style={{ position: "absolute", bottom: "11px" }}
            />
          </div>
          <span className="ultra-large-size" style={{ fontSize: "16px" }}>
            {this.props.maxLabel}
          </span>
        </div>
      </div>
    );
  }
}

export default SliderList;
