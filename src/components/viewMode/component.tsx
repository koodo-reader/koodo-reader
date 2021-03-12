//为空页面
import React from "react";
import "./viewMode.css";
import { Trans } from "react-i18next";
import { ViewModeProps, ViewModeState } from "./interface";
import OtherUtil from "../../utils/otherUtil";

class ViewMode extends React.Component<ViewModeProps, ViewModeState> {
  constructor(props: ViewModeProps) {
    super(props);
    this.state = {
      isClicked: false,
    };
  }
  handleChange = (mode: string) => {
    OtherUtil.setReaderConfig("viewMode", mode);
    this.props.handleFetchList();
  };
  handleClick = (bool) => {
    this.setState({ isClicked: bool });
  };
  render() {
    return (
      <div
        className="book-list-view"
        onMouseEnter={() => {
          this.handleClick(true);
        }}
        onMouseLeave={() => {
          this.handleClick(false);
        }}
        style={
          this.state.isClicked
            ? { boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.18)" }
            : { height: "20px" }
        }
      >
        <span className="icon-dropdown view-mode-down"></span>
        <div
          className="card-list-mode"
          onClick={() => {
            this.handleChange("card");
          }}
          style={
            this.props.viewMode !== "card" && !this.state.isClicked
              ? { display: "none" }
              : this.props.viewMode !== "card" && this.state.isClicked
              ? { color: "rgba(75,75,75,0.5)" }
              : {}
          }
        >
          <span className="icon-grid"></span>
          <span className="view-name">
            <Trans>Card Mode</Trans>
          </span>
        </div>
        <div
          className="list-view-mode"
          onClick={() => {
            this.handleChange("list");
          }}
          style={
            this.props.viewMode !== "list" && !this.state.isClicked
              ? { display: "none" }
              : this.props.viewMode !== "list" && this.state.isClicked
              ? { color: "rgba(75,75,75,0.5)" }
              : {}
          }
        >
          <span className="icon-list"></span>
          <span className="view-name">
            <Trans>List Mode</Trans>
          </span>
        </div>
        <div
          className="list-view-mode"
          onClick={() => {
            this.handleChange("cover");
          }}
          style={
            this.props.viewMode !== "cover" && !this.state.isClicked
              ? { display: "none" }
              : this.props.viewMode !== "cover" && this.state.isClicked
              ? { color: "rgba(75,75,75,0.5)" }
              : {}
          }
        >
          <span className="icon-cover" style={{ marginRight: 5 }}></span>
          <span className="view-name">
            <Trans>Cover Mode</Trans>
          </span>
        </div>
      </div>
    );
  }
}

export default ViewMode;
