//消息提示
import React from "react";
import { connect } from "react-redux";
import "./messageBox.css";
import { stateType } from "../../redux/store";
import { Trans, withNamespaces } from "react-i18next";

export interface MessageBoxProps {
  message: string;
}
class MessageBox extends React.Component<MessageBoxProps> {
  render() {
    return (
      <div className="message-box-container">
        <span className="icon-success  message-box-icon"></span>
        <div className="message-content">
          <Trans>{this.props.message}</Trans>
        </div>
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
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(MessageBox as any));
