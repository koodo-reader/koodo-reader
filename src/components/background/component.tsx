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
      scale: ConfigService.getReaderConfig("scale") || 1,
      margin: parseInt(ConfigService.getReaderConfig("margin")) || 0,
      pageOffset: "",
      pageWidth: "",
    };
    this.isFirst = true;
  }
  componentDidMount() {
    console.log(this.props.readerMode, "readermode");
    this.setState(
      getPageWidth(
        this.props.readerMode,
        this.state.scale,
        this.state.margin,
        this.props.isNavLocked
      )
    );
  }

  render() {
    console.log(this.state.pageOffset, "pageOffset");
    console.log(this.state.pageWidth, "pageWidth");
    return (
      <>
        <div
          className="background-box2"
          style={
            document.body.clientWidth < 720
              ? { left: 5, right: 8 }
              : this.state.isSingle
              ? {
                  left: this.state.pageOffset,
                  marginLeft: -50,
                  width: `calc(${this.state.pageWidth} + 105px)`,
                  boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
                }
              : { left: this.props.isNavLocked ? 305 : 0 }
          }
        ></div>

        <div
          className="background-box3"
          style={
            document.body.clientWidth < 720
              ? { left: 5, right: 10 }
              : this.state.isSingle
              ? {
                  marginLeft: -50,
                  left: this.state.pageOffset,
                  width: `calc(${this.state.pageWidth} + 107px)`,
                }
              : { left: this.props.isNavLocked ? 307 : 0 }
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
            document.body.clientWidth < 720
              ? { left: 5, right: 6 }
              : this.state.isSingle
              ? {
                  marginLeft: -50,
                  left: this.state.pageOffset,
                  width: `calc(${this.state.pageWidth} + 109px)`,
                  boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
                }
              : { left: this.props.isNavLocked ? 309 : 0 }
          }
        ></div>
      </>
    );
  }
}

export default Background;
