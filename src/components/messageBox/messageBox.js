//消息提示
import React, { Component } from "react";
import { connect } from "react-redux";
import "./messageBox.css";
class MessageBox extends Component {
  render() {
    return (
      <div className="message-box-container">
        <span className="icon-success  message-box-icon"></span>
        <div className="message-content">{this.props.message}</div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    message: state.manager.message
  };
};
const actionCreator = {};
MessageBox = connect(mapStateToProps, actionCreator)(MessageBox);
export default MessageBox;
