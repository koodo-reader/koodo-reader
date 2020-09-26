import React from "react";
// import "./deletePopup.css";
import { Trans } from "react-i18next";
import { DeletePopupProps } from "./interface";

class DeletePopup extends React.Component<DeletePopupProps> {
  handleCancel = () => {
    this.props.handleDeletePopup(false);
  };
  handleComfirm = () => {
    //从列表删除和从图书库删除判断
    this.props.handleDeletePopup(false);
    this.props.handleDeleteOpearion();
    this.props.handleMessage("Delete Successfully");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="delete-dialog-container">
        <div className="delete-dialog-title">
          <Trans>{this.props.title}</Trans>
        </div>

        <div className="delete-dialog-book">
          <div className="delete-dialog-book-title">{this.props.name}</div>
        </div>

        <div className="delete-dialog-other-option">
          <Trans>{this.props.description}</Trans>
        </div>

        <div
          className="delete-dialog-cancel"
          onClick={() => {
            this.handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="delete-dialog-comfirm"
          onClick={() => {
            this.handleComfirm();
          }}
        >
          <Trans>Delete</Trans>
        </div>
      </div>
    );
  }
}

export default DeletePopup;
