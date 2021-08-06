import React from "react";
import "./messageBox.css";
import { Trans } from "react-i18next";
import { MessageBoxProps } from "./interface";

class MessageBox extends React.Component<MessageBoxProps> {
  render() {
    return (
      <div className="message-box-container-parent">
        <div className="message-box-container">
          <span className="icon-success  message-box-icon"></span>
          <div className="message-content">
            <Trans>{this.props.message}</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default MessageBox;
