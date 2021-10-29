import React from "react";
import "./settingPanel.css";
import ThemeList from "../../../components/readerSettings/themeList";
import SliderList from "../../../components/readerSettings/sliderList";
import DropdownList from "../../../components/readerSettings/dropdownList";
import ModeControl from "../../../components/readerSettings/modeControl";
import ReaderSwitch from "../../../components/readerSettings/settingSwitch";
import { SettingPanelProps, SettingPanelState } from "./interface";
import { Trans } from "react-i18next";
import StorageUtil from "../../../utils/storageUtil";
import { Tooltip } from "react-tippy";

class SettingPanel extends React.Component<
  SettingPanelProps,
  SettingPanelState
> {
  constructor(props: SettingPanelProps) {
    super(props);
    this.state = {
      readerMode: StorageUtil.getReaderConfig("readerMode") || "double",
      isSettingLocked:
        StorageUtil.getReaderConfig("isSettingLocked") === "yes" ? true : false,
    };
  }

  handleLock = () => {
    this.setState({ isSettingLocked: !this.state.isSettingLocked }, () => {
      StorageUtil.setReaderConfig(
        "isSettingLocked",
        this.state.isSettingLocked ? "yes" : "no"
      );
    });
  };

  render() {
    return (
      <div className="setting-panel-parent">
        <Tooltip
          title={this.props.t(this.state.isSettingLocked ? "Unlock" : "Lock")}
          position="bottom"
          trigger="mouseenter"
          style={{ height: "30px", display: "inline-block", float: "left" }}
        >
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
        </Tooltip>
        <div className="setting-panel-title">
          <Trans>Reading Option</Trans>
        </div>
        <div className="setting-panel">
          {Object.keys(this.props.currentEpub).length !== 0 && <ModeControl />}
          <ThemeList />
          <SliderList
            {...{
              maxValue: 40,
              minValue: 13,
              mode: "fontSize",
              minLabel: "13",
              maxLabel: "40",
              step: 1,
              title: "Font Size",
            }}
          />
          {Object.keys(this.props.currentEpub).length !== 0 && (
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
          )}
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
          {Object.keys(this.props.currentEpub).length !== 0 && (
            <SliderList
              {...{
                maxValue: 60,
                minValue: 0,
                mode: "paraSpacing",
                minLabel: "0",
                maxLabel: "60",
                step: 1,
                title: "Paragraph Spacing",
              }}
            />
          )}
          {(this.state.readerMode && this.state.readerMode !== "double") ||
          this.props.currentBook.description === "readonly" ? (
            <SliderList
              {...{
                maxValue: 3,
                minValue: 0.5,
                mode: "scale",
                minLabel: "0.5",
                maxLabel: "3",
                step: 0.1,
                title: "Scale",
              }}
            />
          ) : null}
          <SliderList
            {...{
              maxValue: 2,
              minValue: 0.5,
              mode: "brightness",
              minLabel: "0.5",
              maxLabel: "2",
              step: 0.1,
              title: "Brightness",
            }}
          />
          <DropdownList />
          <ReaderSwitch />
        </div>
      </div>
    );
  }
}

export default SettingPanel;
