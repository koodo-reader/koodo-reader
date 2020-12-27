//右侧阅读选项面板
import React from "react";
import "./settingPanel.css";
import ThemeList from "../../components/themeList";
import SliderList from "../../components/sliderList";
import DropdownList from "../../components/dropdownList";
import ModeControl from "../../components/modeControl";
import { SettingPanelProps, SettingPanelState } from "./interface";
import { Trans } from "react-i18next";
import OtherUtil from "../../utils/otherUtil";

class SettingPanel extends React.Component<
  SettingPanelProps,
  SettingPanelState
> {
  constructor(props: SettingPanelProps) {
    super(props);
    this.state = {
      isSupported: false,
      isAudioOn: false,
      readerMode: OtherUtil.getReaderConfig("readerMode"),
    };
  }
  componentDidMount() {
    if ("speechSynthesis" in window) {
      this.setState({ isSupported: true });
    }
    if (this.state.isAudioOn) {
      window.speechSynthesis && window.speechSynthesis.cancel();
      this.setState({ isAudioOn: false });
    }
  }
  handleChangeAudio = () => {
    if (this.state.isAudioOn) {
      window.speechSynthesis.cancel();
      this.setState({ isAudioOn: false });
    } else {
      this.setState({ isAudioOn: true }, () => {
        this.handleAudio();
      });
    }
  };
  handleAudio = () => {
    const currentLocation = this.props.currentEpub.rendition.currentLocation();
    const cfibase = currentLocation.start.cfi
      .replace(/!.*/, "")
      .replace("epubcfi(", "");
    const cfistart = currentLocation.start.cfi
      .replace(/.*!/, "")
      .replace(/\)/, "");
    const cfiend = currentLocation.end.cfi.replace(/.*!/, "").replace(/\)/, "");
    const cfiRange = `epubcfi(${cfibase}!,${cfistart},${cfiend})`;
    this.props.currentEpub.getRange(cfiRange).then((range: any) => {
      let text = range.toString();
      text = text
        .replace(/\s\s/g, "")
        .replace(/\r/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "")
        .replace(/\f/g, "");
      var msg = new SpeechSynthesisUtterance();
      msg.text = text;
      window.speechSynthesis.speak(msg);
      msg.onend = (event) => {
        console.log(
          "Utterance has finished being spoken after " +
            event.elapsedTime +
            " milliseconds."
        );
        if (!this.state.isAudioOn || this.props.isReading) {
          return;
        }
        this.props.currentEpub.rendition.next().then(() => {
          this.handleAudio();
        });
      };
    });
  };
  render() {
    return (
      <div className="setting-panel-parent">
        <div className="setting-panel">
          <div className="setting-panel-title">
            <Trans>Reading Option</Trans>
          </div>
          <ModeControl />

          {this.state.isSupported ? (
            <div className="single-control-switch-container">
              <span className="single-control-switch-title">
                {this.state.isAudioOn ? (
                  <Trans>Turn off audio</Trans>
                ) : (
                  <Trans>Turn on audio</Trans>
                )}
              </span>

              <span
                className="single-control-switch"
                onClick={() => {
                  if (this.props.locations) {
                    this.handleChangeAudio();
                  } else {
                    this.props.handleMessage("Audio is not ready yet");
                    this.props.handleMessageBox(true);
                  }
                }}
                style={this.props.locations ? {} : { opacity: 0.5 }}
              >
                <span
                  className="single-control-button"
                  style={this.state.isAudioOn ? { float: "right" } : {}}
                ></span>
              </span>
            </div>
          ) : null}
          <ThemeList />
          <SliderList
            {...{
              maxValue: 31,
              minValue: 13,
              mode: "fontSize",
            }}
          />
          {this.state.readerMode && this.state.readerMode !== "double" ? (
            <SliderList
              {...{
                maxValue: 2,
                minValue: 1,
                mode: "scale",
              }}
            />
          ) : null}

          <DropdownList />
        </div>
      </div>
    );
  }
}

export default SettingPanel;
