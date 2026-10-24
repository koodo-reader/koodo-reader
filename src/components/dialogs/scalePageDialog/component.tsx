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

const ScalePageDialog = (props: ScalePageDialogProps) => {
  const handlePresetChange = (scale: string) => {
    ConfigService.setReaderConfig("scale", scale);
    props.handleScale(scale);
    props.renderBookFunc();
  };

  return (
    <div
      className="sort-dialog-container scale-page-dialog-container"
      onMouseLeave={() => {
        props.handleScalePageDialog(false);
      }}
      onMouseEnter={() => {
        props.handleScalePageDialog(true);
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
              pageWidthPresetList.some((opt) => opt.value === props.scale)
                ? props.scale
                : ""
            }
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              handlePresetChange(value);
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
          isEnabled={props.isFitPage}
          onClick={() => {
            const next = !props.isFitPage;
            ConfigService.setReaderConfig("isFitPage", next ? "yes" : "no");
            props.handleFitPage(next);
            toast(props.t("Change successful"));
            setTimeout(() => {
              props.renderBookFunc();
            }, 300);
          }}
        />
      </ul>
    </div>
  );
};

export default ScalePageDialog;
