import React from "react";
import "./actionDialog.css";
import { Trans } from "react-i18next";
import { ActionDialogProps } from "./interface";

class ActionDialog extends React.Component<ActionDialogProps> {
  handleDeleteBook = () => {
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleDeleteDialog(true);
    this.props.handleActionDialog(false);
  };
  handleEditBook = () => {
    this.props.handleEditDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleAddShelf = () => {
    this.props.handleAddDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  render() {
    return (
      <div
        className="action-dialog-container"
        onMouseLeave={() => {
          this.props.handleActionDialog(false);
        }}
        style={{ left: this.props.left, top: this.props.top }}
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-add"
            onClick={() => {
              this.handleAddShelf();
            }}
          >
            <span className="icon-shelf view-icon"></span>
            <span className="action-name">
              <Trans>Add</Trans>
            </span>
          </div>
          <div
            className="action-dialog-delete"
            onClick={() => {
              this.handleDeleteBook();
            }}
          >
            <span className="icon-trash view-icon"></span>
            <span className="action-name">
              <Trans>Delete</Trans>
            </span>
          </div>
          <div
            className="action-dialog-edit"
            onClick={() => {
              this.handleEditBook();
            }}
          >
            <span className="icon-edit view-icon"></span>
            <span className="action-name">
              <Trans>Edit</Trans>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default ActionDialog;
