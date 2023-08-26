import React from "react";
import "./style.css";
import { withRouter } from "react-router-dom";
import { stateType } from "../../store";
import { connect } from "react-redux";
import { handleReadingState } from "../../store/actions";
import { isElectron } from "react-device-detect";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import { PDFWidgetProps, PDFWidgetState } from "./interface";

class PDFWidget extends React.Component<PDFWidgetProps, PDFWidgetState> {
  constructor(props: PDFWidgetProps) {
    super(props);
    this.state = {
      isHover: false,
    };
  }
  render() {
    return (
      <div
        className="back-main-container"
        style={this.state.isHover ? {} : { width: "30px", left: "-20px" }}
        onMouseEnter={() => {
          this.setState({ isHover: true });
        }}
        onMouseLeave={() => {
          this.setState({ isHover: false });
        }}
      >
        <span
          className="icon-home back-home-home"
          onClick={() => {
            if (
              isElectron &&
              StorageUtil.getReaderConfig("isOpenInMain") !== "yes"
            ) {
              if (
                window
                  .require("electron")
                  .ipcRenderer.sendSync("check-main-open", "ping")
              ) {
                window
                  .require("electron")
                  .ipcRenderer.invoke("focus-on-main", "ping");
                window.close();
              } else {
                window
                  .require("electron")
                  .ipcRenderer.invoke("create-new-main", "ping");
                window.close();
              }
            } else {
              this.props.history.push("/manager/home");
              document.title = "Koodo Reader";
              this.props.handleReadingState(false);
            }
          }}
          style={this.state.isHover ? {} : { display: "none" }}
        ></span>
        <span
          className="icon-day back-home-day"
          onClick={() => {
            document
              .querySelector(".ebook-viewer")
              ?.setAttribute("style", "height:100%; overflow: hidden;");
          }}
          style={this.state.isHover ? {} : { display: "none" }}
        ></span>
        <span
          className="icon-night back-home-night"
          onClick={() => {
            document
              .querySelector(".ebook-viewer")
              ?.setAttribute(
                "style",
                "height:100%; overflow: hidden; filter: invert(100%);"
              );
          }}
          style={this.state.isHover ? {} : { display: "none" }}
        ></span>
        <span
          className="icon-eye back-home-eye"
          onClick={() => {
            document
              .querySelector(".ebook-viewer")
              ?.setAttribute(
                "style",
                "height:100%; overflow: hidden; filter: sepia(100%);"
              );
          }}
          style={this.state.isHover ? {} : { display: "none" }}
        ></span>

        <span
          className="icon-dropdown back-home-dropdown"
          onClick={() => {
            document
              .querySelector(".ebook-viewer")
              ?.setAttribute(
                "style",
                "height:100%; overflow: hidden; filter: sepia(100%);"
              );
          }}
          style={this.state.isHover ? { display: "none" } : {}}
        ></span>
      </div>
    );
  }
}

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleReadingState };
export default connect(
  mapStateToProps,
  actionCreator
)(withRouter(PDFWidget as any));
