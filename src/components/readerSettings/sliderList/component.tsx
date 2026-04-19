import React from "react";
import { Trans } from "react-i18next";
import { SliderListProps, SliderListState } from "./interface";
import "./sliderList.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
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

  getClampedValue = (rawValue: string) => {
    const { minValue, maxValue } = this.props.item;
    const parsedValue = parseFloat(rawValue);
    const min = parseFloat(minValue);
    const max = parseFloat(maxValue);

    if (Number.isNaN(parsedValue)) {
      return this.state[this.props.item.mode];
    }

    return Math.min(Math.max(parsedValue, min), max).toString();
  };

  applyValue = (mode: string, nextValue: string) => {
    this.setState({ [mode]: nextValue } as any);
    ConfigService.setReaderConfig(mode, nextValue);

    if (mode === "scale") {
      this.props.handleScale(nextValue);
    }

    if (mode === "margin") {
      this.props.handleMargin(nextValue);
    }
  };

  handleRest = async (mode) => {
    this.props.renderBookFunc();
  };
  onValueChange = (event: any, mode: string) => {
    const nextValue = this.getClampedValue(event.target.value);
    event.target.value = nextValue;
    this.setState({ inputValue: nextValue });
    this.applyValue(mode, nextValue);
  };
  onValueInput = (event: any, mode: string) => {
    this.setState({ [mode]: event.target.value } as any);
  };
  updateValueByStep = (step: number, mode: string, direction: 1 | -1) => {
    this.onValueChange(
      {
        target: {
          value: (parseFloat(this.state[mode]) + step * direction).toString(),
        },
      },
      mode
    );
  };
  handleMinus = (step: number, mode: string) => {
    this.updateValueByStep(step, mode, -1);
  };
  handleAdd = (step: number, mode: string) => {
    this.updateValueByStep(step, mode, 1);
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
