import React from "react";
import "./background.css";
import { BackgroundProps, BackgroundState } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { getPageWidth } from "../../utils/common";
class Background extends React.Component<BackgroundProps, BackgroundState> {
  isFirst: Boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle: this.props.readerMode !== "double",
      scale: ConfigService.getReaderConfig("scale") || "1",
      margin: parseInt(ConfigService.getReaderConfig("margin")) || 0,
      pageOffset: "",
      pageWidth: "",
    };
    this.isFirst = true;
  }
  componentDidMount() {
    this.setState(
      getPageWidth(
        this.props.readerMode,
        this.state.scale,
        this.state.margin,
        this.props.isNavLocked,
        this.props.isSettingLocked
      )
    );
  }

  render() {
    return (
      <>
        <div
          className="background-box2"
          style={
            this.state.isSingle
              ? {
                  left: this.state.pageOffset,
                  marginLeft: -50,
                  width: `calc(${this.state.pageWidth} + 98px)`,
                  boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
                }
              : {
                  left: this.props.isNavLocked ? 305 : 5,
                  right: this.props.isSettingLocked ? 305 : 5,
                }
          }
        ></div>

        <div
          className="background-box3"
          style={
            this.state.isSingle
              ? {
                  marginLeft: -50,
                  left: this.state.pageOffset,
                  width: `calc(${this.state.pageWidth} + 100px)`,
                }
              : {
                  left: this.props.isNavLocked ? 307 : 7,
                  right: this.props.isSettingLocked ? 307 : 7,
                }
          }
        >
          {(!ConfigService.getReaderConfig("backgroundColor") &&
            (ConfigService.getReaderConfig("appSkin") === "night" ||
              (ConfigService.getReaderConfig("appSkin") === "system" &&
                ConfigService.getReaderConfig("isOSNight") === "yes"))) ||
          ConfigService.getReaderConfig("backgroundColor") ===
            "rgba(44,47,49,1)" ? (
            <div
              className="spine-shadow-left"
              style={
                this.state.isSingle
                  ? { display: "none", opacity: 0.5 }
                  : { opacity: 0.5 }
              }
            ></div>
          ) : (
            <div
              className="spine-shadow-left"
              style={this.state.isSingle ? { display: "none" } : {}}
            ></div>
          )}
          <div
            className="book-spine"
            style={this.state.isSingle ? { display: "none" } : {}}
          ></div>
          {(!ConfigService.getReaderConfig("backgroundColor") &&
            (ConfigService.getReaderConfig("appSkin") === "night" ||
              (ConfigService.getReaderConfig("appSkin") === "system" &&
                ConfigService.getReaderConfig("isOSNight") === "yes"))) ||
          ConfigService.getReaderConfig("backgroundColor") ===
            "rgba(44,47,49,1)" ? (
            <div
              className="spine-shadow-right"
              style={
                this.state.isSingle
                  ? {
                      position: "relative",
                      right: 0,
                      opacity: 0.5,
                    }
                  : { opacity: 0.5 }
              }
            ></div>
          ) : (
            <div
              className="spine-shadow-right"
              style={
                this.state.isSingle
                  ? {
                      position: "relative",
                      right: 0,
                    }
                  : {}
              }
            ></div>
          )}
        </div>

        <div
          className="background-box1"
          style={
            this.state.isSingle
              ? {
                  marginLeft: -50,
                  left: this.state.pageOffset,
                  width: `calc(${this.state.pageWidth} + 102px)`,
                  boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
                }
              : {
                  left: this.props.isNavLocked ? 309 : 9,
                  right: this.props.isSettingLocked ? 309 : 9,
                }
          }
        ></div>
      </>
    );
  }
}

export default Background;
