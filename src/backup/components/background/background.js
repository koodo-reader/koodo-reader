//图书下面的背景，包括页边和书脊
import React, { Component } from "react";
import "./background.css";
import { connect } from "react-redux";
class Background extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSingle: localStorage.getItem("isSingle") || "double"
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
            style={this.state.isSingle === "single" ? { display: "none" } : {}}
          ></div>
          <div
            className="book-spine"
            style={this.state.isSingle === "single" ? { display: "none" } : {}}
          ></div>
          <div
            className="spine-shadow-right"
            style={this.state.isSingle === "single" ? { display: "none" } : {}}
          ></div>
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    isSingle: state.reader.isSingle
  };
};
const actionCreator = {};
Background = connect(mapStateToProps, actionCreator)(Background);
export default Background;
