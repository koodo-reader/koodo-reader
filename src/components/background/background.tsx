//图书下面的背景，包括页边和书脊
import React from "react";
import "./background.css";
import { connect } from "react-redux";
export interface BackgroundProps {}
export interface BackgroundState {
  isSingle: boolean;
}
class Background extends React.Component<BackgroundProps, BackgroundState> {
  constructor(props) {
    super(props);
    this.state = {
      isSingle: localStorage.getItem("isSingle") === "single",
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
const mapStateToProps = (state) => {
  return {
    isSingle: state.reader.isSingle,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Background);
