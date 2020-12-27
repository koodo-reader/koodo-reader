//对图书操作的菜单
import React from "react";
import "./actionDialog.css";
import { Trans } from "react-i18next";
import { ActionDialogProps } from "./interface";
import AddTrash from "../../utils/addTrash";
import FileSaver from "file-saver";
import localforage from "localforage";

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
  handleResoreBook = () => {
    AddTrash.clear(this.props.currentBook.key);
    this.props.handleActionDialog(false);
    this.props.handleMessage("Restore Successfully");
    this.props.handleMessageBox(true);
    this.props.handleFetchBooks();
  };
  render() {
    if (this.props.mode === "trash") {
      return (
        <div
          className="action-dialog-container"
          onMouseLeave={() => {
            this.props.handleActionDialog(false);
          }}
          style={{ left: this.props.left, top: this.props.top, height: "40px" }}
        >
          <div className="action-dialog-actions-container">
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleResoreBook();
              }}
            >
              <span className="icon-clockwise view-icon"></span>
              <span className="action-name">
                <Trans>Restore</Trans>
              </span>
            </div>
          </div>
        </div>
      );
    }
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
          <div
            className="action-dialog-edit"
            onClick={() => {
              localforage
                .getItem(this.props.currentBook.key)
                .then((result: any) => {
                  FileSaver.saveAs(
                    new Blob([result]),
                    this.props.currentBook.name +
                      `${
                        this.props.currentBook.description === "pdf"
                          ? ".pdf"
                          : ".epub"
                      }`
                  );
                });
            }}
          >
            <span className="icon-export view-icon"></span>
            <span className="action-name">
              <Trans>Export</Trans>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default ActionDialog;
