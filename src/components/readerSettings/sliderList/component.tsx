import React from "react";
import { Trans } from "react-i18next";
import { SliderListProps, SliderListState } from "./interface";
import "./sliderList.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import BookUtil from "../../../utils/file/bookUtil";
class SliderList extends React.Component<SliderListProps, SliderListState> {
  constructor(props: SliderListProps) {
    super(props);
    this.state = {
      isTyping: false,
      inputValue: "",
      isEntered: false,
      fontSize: ConfigService.getReaderConfig("fontSize") || "17",
      scale: ConfigService.getReaderConfig("scale") || "1",
      letterSpacing: ConfigService.getReaderConfig("letterSpacing") || "0",
      paraSpacing: ConfigService.getReaderConfig("paraSpacing") || "0",
      brightness: ConfigService.getReaderConfig("brightness") || "1",
      margin: ConfigService.getReaderConfig("margin") || "0",
    };
  }
  handleRest = async (mode) => {
    this.props.renderBookFunc();
  };
  onValueChange = (event: any, mode: string) => {
    if (mode === "fontSize") {
      const fontSize = event.target.value;
      this.setState({ [mode]: fontSize });
      ConfigService.setReaderConfig("fontSize", fontSize);
    } else if (mode === "scale") {
      const scale = event.target.value;
      this.setState({ [mode]: scale });
      this.props.handleScale(scale);
      ConfigService.setReaderConfig("scale", scale);
    } else if (mode === "letterSpacing") {
      const letterSpacing = event.target.value;
      this.setState({ [mode]: letterSpacing });
      ConfigService.setReaderConfig("letterSpacing", letterSpacing);
    } else if (mode === "paraSpacing") {
      const paraSpacing = event.target.value;
      this.setState({ [mode]: paraSpacing });
      ConfigService.setReaderConfig("paraSpacing", paraSpacing);
    } else if (mode === "brightness") {
      let brightness = event.target.value;
      if (brightness < 0.3) {
        brightness = 0.3;
      }
      this.setState({ [mode]: brightness });
      ConfigService.setReaderConfig("brightness", brightness);
    } else {
      const margin = event.target.value;
      this.setState({ [mode]: margin } as any);
      this.props.handleMargin(margin);
      ConfigService.setReaderConfig("margin", margin);
    }
  };
  onValueInput = (event: any, mode: string) => {
    this.setState({ [mode]: event.target.value } as any);
  };
  handleMinus = (step: number, mode: string) => {
    this.setState({ [mode]: parseFloat(this.state[mode]) - step + "" } as any);
    this.onValueChange(
      {
        target: { value: parseFloat(this.state[mode]) - step + "" },
      },
      mode
    );
  };
  handleAdd = (step: number, mode: string) => {
    this.setState({ [mode]: parseFloat(this.state[mode]) + step + "" } as any);
    this.onValueChange(
      {
        target: { value: parseFloat(this.state[mode]) + step + "" },
      },
      mode
    );
  };
  render() {
    return (
      <div className="font-size-setting">
        <div className="font-size-title">
          <span style={{ marginRight: "10px" }}>
            <Trans>{this.props.item.title}</Trans>
          </span>

          <input
            className="input-value"
            value={
              this.state.isTyping
                ? this.state.inputValue
                : this.state[this.props.item.mode]
            }
            type="number"
            step={
              this.props.item.title === "Page width" ||
              this.props.item.title === "Brightness"
                ? "0.1"
                : "1"
            }
            onInput={(event: any) => {
              let fieldVal = event.target.value;
              this.setState({ inputValue: fieldVal });
            }}
            onChange={(event) => {
              let fieldVal = event.target.value;
              this.setState({ inputValue: fieldVal });
            }}
            onFocus={() => {
              this.setState({ isTyping: true });
            }}
            onBlur={(event) => {
              if (!this.state.isEntered) {
                let fieldVal = event.target.value;
                if (!fieldVal) return;
                this.onValueChange(event, this.props.item.mode);
                this.setState({ isTyping: false });
                this.handleRest(this.props.item.mode);
              } else {
                this.setState({ isEntered: false });
              }
            }}
            onKeyDown={(event: any) => {
              if (event.key === "Enter") {
                this.setState({ isEntered: true });
                let fieldVal = event.target.value;
                if (!fieldVal) return;
                this.onValueChange(event, this.props.item.mode);
                this.setState({ isTyping: false });
                this.handleRest(this.props.item.mode);
              }
            }}
          />
          <span style={{ marginLeft: "10px" }}>
            {this.state[this.props.item.mode]}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <span className="ultra-small-size">{this.props.item.minLabel}</span>
          <div className="font-size-selector">
            <input
              className="input-progress"
              value={this.state[this.props.item.mode]}
              type="range"
              max={this.props.item.maxValue}
              min={this.props.item.minValue}
              step={this.props.item.step}
              onInput={(event) => {
                this.onValueChange(event, this.props.item.mode);
              }}
              onChange={(event) => {
                this.onValueInput(event, this.props.item.mode);
              }}
              onMouseUp={() => {
                this.handleRest(this.props.item.mode);
              }}
              style={{ position: "absolute", bottom: "11px" }}
            />
          </div>
          <span className="ultra-large-size" style={{ fontSize: "16px" }}>
            {this.props.item.maxLabel}
          </span>
        </div>
      </div>
    );
  }
}

export default SliderList;
