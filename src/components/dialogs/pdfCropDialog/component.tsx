import React from "react";
import { Trans } from "react-i18next";
import { PdfCropDialogProps, PdfCropDialogState } from "./interface";
import "../../readerSettings/sliderList/sliderList.css";
import BookUtil from "../../../utils/file/bookUtil";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

const cropSliderConfigs = [
  {
    maxValue: 50,
    minValue: 0,
    mode: "top",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop top",
  },
  {
    maxValue: 50,
    minValue: 0,
    mode: "bottom",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop bottom",
  },
  {
    maxValue: 50,
    minValue: 0,
    mode: "left",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop left",
  },
  {
    maxValue: 50,
    minValue: 0,
    mode: "right",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop right",
  },
];

interface PdfCropSliderProps {
  item: (typeof cropSliderConfigs)[number];
  value: number;
  onValueChange: (mode: string, value: number) => void;
  onCommit: () => void;
}

interface PdfCropSliderState {
  inputValue: string;
  isTyping: boolean;
  isEntered: boolean;
}

class PdfCropSlider extends React.Component<
  PdfCropSliderProps,
  PdfCropSliderState
> {
  constructor(props: PdfCropSliderProps) {
    super(props);
    this.state = {
      inputValue: "",
      isTyping: false,
      isEntered: false,
    };
  }

  getClampedValue = (rawValue: string) => {
    const { minValue, maxValue } = this.props.item;
    const parsedValue = parseFloat(rawValue);
    const min = minValue;
    const max = maxValue;

    if (Number.isNaN(parsedValue)) {
      return this.props.value.toString();
    }

    return Math.min(Math.max(parsedValue, min), max).toString();
  };

  applyValue = (nextValue: string) => {
    this.props.onValueChange(this.props.item.mode, parseFloat(nextValue));
  };

  onValueChange = (event: any) => {
    const nextValue = this.getClampedValue(event.target.value);
    event.target.value = nextValue;
    this.setState({ inputValue: nextValue });
    this.applyValue(nextValue);
  };

  onValueInput = (event: any) => {
    this.props.onValueChange(
      this.props.item.mode,
      parseFloat(event.target.value) || 0
    );
  };

  render() {
    const displayValue = this.props.value.toString();
    return (
      <div className="font-size-setting">
        <div className="font-size-title">
          <span style={{ marginRight: "10px" }}>
            <Trans>{this.props.item.title}</Trans>
          </span>

          <input
            className="input-value"
            value={this.state.isTyping ? this.state.inputValue : displayValue}
            type="number"
            step="1"
            onInput={(event: any) => {
              this.setState({ inputValue: event.target.value });
            }}
            onChange={(event) => {
              this.setState({ inputValue: event.target.value });
            }}
            onFocus={() => {
              this.setState({ isTyping: true });
            }}
            onBlur={(event) => {
              if (!this.state.isEntered) {
                const fieldVal = event.target.value;
                if (!fieldVal) return;
                this.onValueChange(event);
                this.setState({ isTyping: false });
                this.props.onCommit();
              } else {
                this.setState({ isEntered: false });
              }
            }}
            onKeyDown={(event: any) => {
              if (event.key === "Enter") {
                this.setState({ isEntered: true });
                const fieldVal = event.target.value;
                if (!fieldVal) return;
                this.onValueChange(event);
                this.setState({ isTyping: false });
                this.props.onCommit();
              }
            }}
          />
          <span style={{ marginLeft: "10px" }}>{displayValue}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <span className="ultra-small-size">{this.props.item.minLabel}</span>
          <div className="font-size-selector">
            <input
              className="input-progress"
              value={displayValue}
              type="range"
              max={this.props.item.maxValue}
              min={this.props.item.minValue}
              step={this.props.item.step}
              onInput={(event) => {
                this.onValueChange(event);
              }}
              onChange={(event) => {
                this.onValueInput(event);
              }}
              onMouseUp={() => {
                this.props.onCommit();
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

class PdfCropDialog extends React.Component<
  PdfCropDialogProps,
  PdfCropDialogState
> {
  constructor(props: PdfCropDialogProps) {
    super(props);
    const crop = ConfigService.getObjectConfig(
      props.currentBook?.key,
      "pdfCrop",
      null
    );
    this.state = {
      top: Number(crop?.top) || 0,
      bottom: Number(crop?.bottom) || 0,
      left: Number(crop?.left) || 0,
      right: Number(crop?.right) || 0,
    };
  }

  handleValueChange = (mode: string, value: number) => {
    this.setState({ [mode]: value } as Pick<
      PdfCropDialogState,
      keyof PdfCropDialogState
    >);
  };

  handleCommit = () => {
    const { top, bottom, left, right } = this.state;
    const bookKey = this.props.currentBook.key;
    if (top === 0 && bottom === 0 && left === 0 && right === 0) {
      ConfigService.deleteObjectConfig(bookKey, "pdfCrop");
    } else {
      ConfigService.setObjectConfig(
        bookKey,
        { top, bottom, left, right },
        "pdfCrop"
      );
    }
    BookUtil.reloadBooks(this.props.currentBook);
  };

  render() {
    return (
      <div
        className="sort-dialog-container"
        onMouseLeave={() => {
          this.props.handlePdfCropDialog(false);
        }}
        onMouseEnter={() => {
          this.props.handlePdfCropDialog(true);
        }}
        style={{
          left: "auto",
          top: "50px",
          width: "280px",
          right: this.props.isSettingLocked ? 325 : 20,
          paddingBottom: "20px",
        }}
      >
        <ul className="sort-by-category">
          <div
            className="setting-dialog-new-title"
            style={{
              marginLeft: 10,
              width: "calc(100% - 20px)",
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            <Trans>Crop PDF</Trans>
            <span>{" (%)"}</span>
          </div>
          {cropSliderConfigs.map((item) => (
            <PdfCropSlider
              key={item.mode}
              item={item}
              value={this.state[item.mode as keyof PdfCropDialogState]}
              onValueChange={this.handleValueChange}
              onCommit={this.handleCommit}
            />
          ))}
        </ul>
      </div>
    );
  }
}

export default PdfCropDialog;
