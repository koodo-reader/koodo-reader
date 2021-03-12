//右侧阅读选项面板
import React from "react";
import "./settingPanel.css";
import ThemeList from "../../../components/themeList";
import SliderList from "../../../components/sliderList";
import DropdownList from "../../../components/dropdownList";
import ModeControl from "../../../components/modeControl";
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
      isSupported: false,
      isAudioOn: false,
      isBold: OtherUtil.getReaderConfig("isBold") === "yes",
      readerMode: OtherUtil.getReaderConfig("readerMode") || "double",
      isUseBackground: OtherUtil.getReaderConfig("isUseBackground") === "yes",
      isSettingLocked:
        OtherUtil.getReaderConfig("isSettingLocked") === "yes" ? true : false,
      isShowFooter: OtherUtil.getReaderConfig("isShowFooter") !== "no",
      isShowHeader: OtherUtil.getReaderConfig("isShowHeader") !== "no",
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
  handleBold = () => {
    this.props.currentEpub.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-weight": `${this.state.isBold ? "bold !important" : ""}`,
      },
    });
    this.setState({ isBold: !this.state.isBold });
    OtherUtil.setReaderConfig("isBold", this.state.isBold ? "no" : "yes");
    window.location.reload();
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
  handleChangeBackground = () => {
    this.setState({ isUseBackground: !this.state.isUseBackground });
    OtherUtil.setReaderConfig(
      "isUseBackground",
      this.state.isUseBackground ? "no" : "yes"
    );
    this.state.isUseBackground
      ? this.props.handleMessage("Turn Off Successfully")
      : this.props.handleMessage("Turn On Successfully");
    this.props.handleMessageBox(true);
    window.location.reload();
  };
  handleFooter = () => {
    this.setState({ isShowFooter: !this.state.isShowFooter });
    OtherUtil.setReaderConfig(
      "isShowFooter",
      this.state.isShowFooter ? "no" : "yes"
    );
    this.state.isShowFooter
      ? this.props.handleMessage("Turn On Successfully")
      : this.props.handleMessage("Turn Off Successfully");
    this.props.handleMessageBox(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  handleHeader = () => {
    this.setState({ isShowHeader: !this.state.isShowHeader });
    OtherUtil.setReaderConfig(
      "isShowHeader",
      this.state.isShowHeader ? "no" : "yes"
    );
    this.state.isShowHeader
      ? this.props.handleMessage("Turn On Successfully")
      : this.props.handleMessage("Turn Off Successfully");
    this.props.handleMessageBox(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
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
            }}
          />
          {this.state.readerMode && this.state.readerMode !== "double" ? (
            <SliderList
              {...{
                maxValue: 4,
                minValue: 1,
                mode: "scale",
                minLabel: "1",
                maxLabel: "4",
                step: 0.1,
              }}
            />
          ) : null}

          <DropdownList />
          {this.state.isSupported ? (
            <div className="single-control-switch-container">
              <span className="single-control-switch-title">
                <Trans>Turn on audio</Trans>
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
                style={
                  this.props.locations
                    ? this.state.isAudioOn
                      ? { background: "rgba(46, 170, 220)" }
                      : {}
                    : { opacity: 0.5 }
                }
              >
                <span
                  className="single-control-button"
                  style={
                    this.state.isAudioOn
                      ? {
                          transform: "translateX(20px)",
                          transition: "transform 0.5s ease",
                        }
                      : {
                          transform: "translateX(0px)",
                          transition: "transform 0.5s ease",
                        }
                  }
                ></span>
              </span>
            </div>
          ) : null}
          <div className="single-control-switch-container">
            <span className="single-control-switch-title">
              <Trans>Bold Font</Trans>
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                this.handleBold();
              }}
              style={
                this.state.isBold
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  !this.state.isBold
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
          <div
            className="single-control-switch-container"
            style={
              this.state.isAudioOn ? { background: "rgba(46, 170, 220)" } : {}
            }
          >
            <span className="single-control-switch-title">
              <Trans>Don't show footer</Trans>
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                this.handleFooter();
              }}
              style={
                !this.state.isShowFooter
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  this.state.isShowFooter
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
          <div
            className="single-control-switch-container"
            style={
              this.state.isAudioOn ? { background: "rgba(46, 170, 220)" } : {}
            }
          >
            <span className="single-control-switch-title">
              <Trans>Don't show header</Trans>
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                this.handleHeader();
              }}
              style={
                !this.state.isShowHeader
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  this.state.isShowHeader
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
          <div className="single-control-switch-container">
            <span className="single-control-switch-title">
              <Trans>Dont't use mimical background</Trans>
            </span>
            <span
              className="single-control-switch"
              onClick={() => {
                this.handleChangeBackground();
              }}
              style={
                this.state.isUseBackground
                  ? { background: "rgba(46, 170, 220)", float: "right" }
                  : { float: "right" }
              }
            >
              <span
                className="single-control-button"
                style={
                  this.state.isUseBackground
                    ? {
                        transform: "translateX(20px)",
                        transition: "transform 0.5s ease",
                      }
                    : {
                        transform: "translateX(0px)",
                        transition: "transform 0.5s ease",
                      }
                }
              ></span>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default SettingPanel;
