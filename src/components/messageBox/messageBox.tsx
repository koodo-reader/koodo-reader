//消息提示
import React from "react";
import { connect } from "react-redux";
import "./messageBox.css";
import { stateType } from "../../store";

export interface MessageBoxProps {
  message: string;
}
class MessageBox extends React.Component<MessageBoxProps> {
  render() {
    return (
      <div className="message-box-container">
        <span className="icon-success  message-box-icon"></span>
        <div className="message-content">{this.props.message}</div>
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    message: state.manager.message,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(MessageBox);
