//消息提示
import React, { Component } from "react";
import { connect } from "react-redux";
import "./messageBox.css";
class MessageBox extends Component {
  constructor(props) {
    super(props);
    this.state = { message: this.props.message };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ message: nextProps.message });
  }
  render() {
    return (
      <div className="message-box-container">
        <span className="icon-success  message-box-icon"></span>
        <div className="message-content">{this.state.message}</div>
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
