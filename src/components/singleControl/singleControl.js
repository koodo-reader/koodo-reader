//单双页切换
import React, { Component } from "react";
import "./singleControl.css";
import { handleSingle } from "../../redux/reader.redux";
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux";
class SingleControl extends Component {
  constructor(props) {
    super(props);
    this.state = { isSingle: localStorage.getItem("isSingle") || "double" };
  }

  handleClick = mode => {
    // console.log(mode, "sadfsahgj");
    this.props.handleSingle(mode);
    this.setState({ isSingle: mode });
    localStorage.setItem("isSingle", mode);
    this.props.handleMessage("退出后生效");
    this.props.handleMessageBox(true);
  };
  render() {
    // console.log(this.state.isSingle);
    return (
      <div className="single-control-container">
        <div
          className="single-mode-container"
          onClick={() => {
            this.handleClick("single");
          }}
          style={this.state.isSingle === "double" ? { opacity: 0.4 } : {}}
        >
          <span className="icon-single-page single-page-icon"></span>
          <div className="single-mode-text">单页模式</div>
        </div>
        <div
          className="double-mode-container"
          onClick={() => {
            this.handleClick("double");
          }}
          style={this.state.isSingle === "single" ? { opacity: 0.4 } : {}}
        >
          <span className="icon-two-page two-page-icon"></span>
          <div className="double-mode-text">双页模式</div>
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return { isSingle: state.reader.isSingle };
};
const actionCreator = { handleSingle, handleMessageBox, handleMessage };
SingleControl = connect(mapStateToProps, actionCreator)(SingleControl);
export default SingleControl;
