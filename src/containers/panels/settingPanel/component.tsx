import React from "react";
import "./settingPanel.css";
import ThemeList from "../../../components/readerSettings/themeList";
import SliderList from "../../../components/readerSettings/sliderList";
import DropdownList from "../../../components/readerSettings/dropdownList";
import ModeControl from "../../../components/readerSettings/modeControl";
import SettingSwitch from "../../../components/readerSettings/settingSwitch";
import { SettingPanelProps, SettingPanelState } from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

class SettingPanel extends React.Component<
  SettingPanelProps,
  SettingPanelState
> {
  constructor(props: SettingPanelProps) {
    super(props);
    this.state = {
      isSettingLocked:
        ConfigService.getReaderConfig("isSettingLocked") === "yes"
          ? true
          : false,
    };
  }

  handleLock = () => {
    this.setState({ isSettingLocked: !this.state.isSettingLocked }, () => {
      ConfigService.setReaderConfig(
        "isSettingLocked",
        this.state.isSettingLocked ? "yes" : "no"
      );
    });
  };

  render() {
    return (
      <div className="setting-panel-parent">
        <span
          className={
            this.state.isSettingLocked
              ? "icon-lock lock-icon"
              : "icon-unlock lock-icon"
          }
          onClick={() => {
            this.handleLock();
          }}
        ></span>

        <div className="setting-panel-title">
          <Trans>Reading option</Trans>
        </div>
        <div className="setting-panel">
          <ModeControl />
          <ThemeList />
          <SliderList
            {...{
              maxValue: 40,
              minValue: 13,
              mode: "fontSize",
              minLabel: "13",
              maxLabel: "40",
              step: 1,
              title: "Font size",
            }}
          />

          <SliderList
            {...{
              maxValue: 80,
              minValue: 0,
              mode: "margin",
              minLabel: "0",
              maxLabel: "80",
              step: 5,
              title: "Margin",
            }}
          />

          <SliderList
            {...{
              maxValue: 20,
              minValue: 0,
              mode: "letterSpacing",
              minLabel: "0",
              maxLabel: "20",
              step: 1,
              title: "Letter spacing",
            }}
          />

          <SliderList
            {...{
              maxValue: 60,
              minValue: 0,
              mode: "paraSpacing",
              minLabel: "0",
              maxLabel: "60",
              step: 1,
              title: "Paragraph spacing",
            }}
          />

          {this.props.readerMode && this.props.readerMode !== "double" ? (
            <SliderList
              {...{
                maxValue: 3,
                minValue: 0.5,
                mode: "scale",
                minLabel: "0.5",
                maxLabel: "3",
                step: 0.1,
                title: "Page width",
              }}
            />
          ) : null}
          <SliderList
            {...{
              maxValue: 1,
              minValue: 0.3,
              mode: "brightness",
              minLabel: "0.3",
              maxLabel: "1",
              step: 0.1,
              title: "Brightness",
            }}
          />
          <DropdownList />
          <SettingSwitch />
        </div>
      </div>
    );
  }
}

export default SettingPanel;
