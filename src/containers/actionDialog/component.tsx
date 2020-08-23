import React from "react";
import "./actionDialog.css";
import { Trans } from "react-i18next";
import { ActionDialogProps } from "./interface";

class ActionDialog extends React.Component<ActionDialogProps> {
  handleCancel = () => {
    this.props.handleActionDialog(false);
  };
  handleDeleteBook = () => {
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleDeleteDialog(true);
  };
  handleEditBook = () => {
    this.props.handleEditDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
  };
  handleAddShelf = () => {
    this.props.handleAddDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
  };
  render() {
    return (
      <div className="action-dialog-container">
        <div className="action-dialog-title">
          <Trans>Choose your action to this book</Trans>
        </div>
        <div className="action-dialog-book">
          <div className="action-dialog-book-title">
            {this.props.currentBook.name}
          </div>
        </div>
        <div className="action-dialog-actions-container">
          <div className="action-dialog-add">
            <span
              className="icon-shelf view-icon"
              onClick={() => {
                this.handleAddShelf();
              }}
            ></span>
            <p className="action-name">
              <Trans>Add</Trans>
            </p>
          </div>
          <div className="action-dialog-delete">
            <span
              className="icon-trash view-icon"
              onClick={() => {
                this.handleDeleteBook();
              }}
            ></span>
            <p className="action-name">
              <Trans>Delete</Trans>
            </p>
          </div>
          <div className="action-dialog-edit">
            <span
              className="icon-edit view-icon"
              onClick={() => {
                this.handleEditBook();
              }}
            ></span>
            <p className="action-name">
              <Trans>Edit</Trans>
            </p>
          </div>
        </div>
        <div
          className="action-dialog-cancel"
          onClick={() => {
            this.handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
      </div>
    );
  }
}

export default ActionDialog;
