import React from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { pageWidthPresetList } from "../../../constants/dropdownList";
import { ScalePageDialogProps, ScalePageDialogState } from "./interface";
import "./scalePageDialog.css";

class ScalePageDialog extends React.Component<
  ScalePageDialogProps,
  ScalePageDialogState
> {
  constructor(props: ScalePageDialogProps) {
    super(props);
    this.state = {
      scale: ConfigService.getReaderConfig("scale") || props.scale || "1",
    };
  }

  handleScaleChange = (scale: string) => {
    ConfigService.setReaderConfig("scale", scale);
    this.setState({ scale });
    this.props.handleScale(scale);
    this.props.renderBookFunc();
  };

  render() {
    return (
      <div
        className="sort-dialog-container scale-page-dialog-container"
        onMouseLeave={() => {
          this.props.handleScalePageDialog(false);
        }}
        onMouseEnter={() => {
          this.props.handleScalePageDialog(true);
        }}
        style={{
          left: "auto",
          top: "50px",
          width: "260px",
          right:
            this.props.isSettingLocked || this.props.isDockedRight ? 325 : 20,
        }}
      >
        <ul className="sort-by-category">
          <div className="scale-page-dialog-title">
            <Trans>Scale</Trans>
            <div className="scale-page-input-container">
              <input
                className="input-value scale-page-number-input"
                value={
                  this.state.scale === " "
                    ? this.state.scale
                    : Math.round(parseFloat(this.state.scale) * 100)
                }
                type="number"
                onInput={(event: any) => {
                  let fieldVal = event.target.value;
                  ConfigService.setReaderConfig(
                    "scale",
                    parseFloat(fieldVal) / 100 + ""
                  );
                }}
                onFocus={() => {
                  this.setState({ scale: " " });
                }}
                onChange={(event) => {
                  let fieldVal = event.target.value;
                  this.setState({
                    scale: parseFloat(fieldVal) / 100 + "",
                  });
                }}
                onBlur={(event) => {
                  let fieldVal = event.target.value;
                  if (fieldVal.trim() !== "") {
                    ConfigService.setReaderConfig(
                      "scale",
                      parseFloat(fieldVal) / 100 + ""
                    );
                  }
                  this.props.renderBookFunc();
                }}
              />
              <span>%</span>
            </div>
          </div>

          <input
            className="input-progress scale-page-slider"
            value={this.state.scale}
            type="range"
            max={4}
            min={0.5}
            step={0.01}
            onInput={(event: any) => {
              ConfigService.setReaderConfig("scale", event.target.value);
            }}
            onChange={(event) => {
              this.setState({ scale: event.target.value });
            }}
            onMouseUp={() => {
              this.props.handleScale(this.state.scale);
              this.props.renderBookFunc();
            }}
          />

          <div className="scale-page-dialog-title" style={{ marginTop: 12 }}>
            <Trans>Preset</Trans>
            <select
              name=""
              className="scale-page-preset-select"
              value={
                pageWidthPresetList.some(
                  (opt) => opt.value === this.state.scale
                )
                  ? this.state.scale
                  : ""
              }
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                this.handleScaleChange(value);
              }}
            >
              <option value="" hidden></option>
              {pageWidthPresetList.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="general-setting-option"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div
            className="scale-page-fit-switch"
            onClick={() => {
              const next = !this.props.isFitPage;
              ConfigService.setReaderConfig(
                "isFitPage",
                next ? "yes" : "no"
              );
              this.props.handleFitPage(next);
              toast(this.props.t("Change successful"));
              setTimeout(() => {
                this.props.renderBookFunc();
              }, 300);
            }}
          >
            <span className="scale-page-fit-switch-title">
              <Trans>Fit to page</Trans>
            </span>
            <span
              className="single-control-switch"
              style={this.props.isFitPage ? {} : { opacity: 0.6 }}
            >
              <span
                className="single-control-button"
                style={
                  !this.props.isFitPage
                    ? {
                        transform: "translateX(0px)",
                        transition: "transform 0.5s ease",
                      }
                    : {
                        transform: "translateX(20px)",
                        transition: "transform 0.5s ease",
                      }
                }
              ></span>
            </span>
          </div>
        </ul>
      </div>
    );
  }
}

export default ScalePageDialog;
