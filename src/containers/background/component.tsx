//图书下面的背景，包括页边和书脊
import React from "react";
import "./background.css";
import { BackgroundProps, BackgroundState } from "./interface";
import OtherUtil from "../../utils/otherUtil";

class Background extends React.Component<BackgroundProps, BackgroundState> {
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle: OtherUtil.getReaderConfig("isSingle") === "single",
    };
  }
  render() {
    return (
      <div className="background">
        <div className="background-box1"></div>
        <div className="background-box2"></div>
        <div className="background-box3">
          <div
            className="spine-shadow-left"
            style={this.state.isSingle ? { display: "none" } : {}}
          ></div>
          <div
            className="book-spine"
            style={this.state.isSingle ? { display: "none" } : {}}
          ></div>
          <div
            className="spine-shadow-right"
            style={this.state.isSingle ? { display: "none" } : {}}
          ></div>
        </div>
      </div>
    );
  }
}

export default Background;
