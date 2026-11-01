import React from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  pageWidthConfig,
  pageWidthPresetList,
} from "../../../constants/dropdownList";
import SliderList from "../../readerSettings/sliderList";
import SwitchRow from "../../readerSettings/switchRow";
import { ScalePageDialogProps } from "./interface";
import "./scalePageDialog.css";

class ScalePageDialog extends React.Component<ScalePageDialogProps> {
  handlePresetChange = (scale: string) => {
    ConfigService.setReaderConfig("scale", scale);
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
          top: "50px",
          width: "280px",
        }}
      >
        <ul className="sort-by-category">
          <SliderList {...({ item: pageWidthConfig } as any)} />

          <div className="setting-dialog-new-title scale-page-preset-row">
            <Trans>Preset width</Trans>
            <select
              name=""
              className="lang-setting-dropdown"
              value={
                pageWidthPresetList.some(
                  (opt) => opt.value === this.props.scale
                )
                  ? this.props.scale
                  : ""
              }
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                this.handlePresetChange(value);
              }}
            >
              <option value="" hidden></option>
              {pageWidthPresetList.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="lang-setting-option"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <SwitchRow
            title={<Trans>Fit to page</Trans>}
            isEnabled={this.props.isFitPage}
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
          />
        </ul>
      </div>
    );
  }
}

export default ScalePageDialog;
