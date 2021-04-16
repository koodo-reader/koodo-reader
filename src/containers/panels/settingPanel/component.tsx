//右侧阅读选项面板
import React from "react";
import "./settingPanel.css";
import ThemeList from "../../../components/readerSettings/themeList";
import SliderList from "../../../components/readerSettings/sliderList";
import DropdownList from "../../../components/readerSettings/dropdownList";
import ModeControl from "../../../components/readerSettings/modeControl";
import ReaderSwitch from "../../../components/readerSettings/settingSwitch";
import { SettingPanelProps, SettingPanelState } from "./interface";
import { Trans } from "react-i18next";
import OtherUtil from "../../../utils/otherUtil";
import { isMobile } from "react-device-detect";

class SettingPanel extends React.Component<
  SettingPanelProps,
  SettingPanelState
> {
  constructor(props: SettingPanelProps) {
    super(props);
    this.state = {
      readerMode: OtherUtil.getReaderConfig("readerMode") || "double",
      isSettingLocked:
        OtherUtil.getReaderConfig("isSettingLocked") === "yes" ? true : false,
    };
  }

  handleLock = () => {
    this.setState({ isSettingLocked: !this.state.isSettingLocked }, () => {
      OtherUtil.setReaderConfig(
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
          <Trans>Reading Option</Trans>
        </div>
        <div className="setting-panel">
          {!isMobile && <ModeControl />}
          <ThemeList />
          <SliderList
            {...{
              maxValue: 31,
              minValue: 13,
              mode: "fontSize",
              minLabel: "13",
              maxLabel: "31",
              step: 1,
              title: "Font Size",
            }}
          />
          <SliderList
            {...{
              maxValue: 80,
              minValue: 0,
              mode: "margin",
              minLabel: "0",
              maxLabel: "100",
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
              title: "Letter Spacing",
            }}
          />
          <SliderList
            {...{
              maxValue: 40,
              minValue: 0,
              mode: "paraSpacing",
              minLabel: "0",
              maxLabel: "40",
              step: 1,
              title: "Paragraph Spacing",
            }}
          />
          {this.state.readerMode && this.state.readerMode !== "double" ? (
            <SliderList
              {...{
                maxValue: 2,
                minValue: 1,
                mode: "scale",
                minLabel: "1",
                maxLabel: "2",
                step: 0.2,
                title: "Scale",
              }}
            />
          ) : null}
          <DropdownList />
          <ReaderSwitch />
        </div>
      </div>
    );
  }
}

export default SettingPanel;
