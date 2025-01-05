import React from "react";
import "./editDialog.css";

import { Trans } from "react-i18next";
import { EditDialogProps, EditDialogState } from "./interface";
import toast from "react-hot-toast";
import DatabaseService from "../../../utils/storage/databaseService";

class EditDialog extends React.Component<EditDialogProps, EditDialogState> {
  constructor(props: EditDialogProps) {
    super(props);
    this.state = { isCheck: false };
  }
  componentDidMount() {
    const nameBox: HTMLInputElement = document.querySelector(
      ".edit-dialog-book-name-box"
    ) as HTMLInputElement;
    const authorBox: HTMLInputElement = document.querySelector(
      ".edit-dialog-book-author-box"
    ) as HTMLInputElement;
    nameBox.value = this.props.currentBook.name;
    authorBox.value = this.props.currentBook.author;
  }

  handleCancel = () => {
    this.props.handleEditDialog(false);
  };
  handleComfirm = () => {
    const nameBox: HTMLInputElement = document.querySelector(
      ".edit-dialog-book-name-box"
    ) as HTMLInputElement;
    let name = nameBox.value;
    const authorBox: HTMLInputElement = document.querySelector(
      ".edit-dialog-book-author-box"
    ) as HTMLInputElement;
    let author = authorBox.value;
    this.props.currentBook.name = name;
    this.props.currentBook.author = author;
    DatabaseService.updateRecord(this.props.currentBook, "books").then(() => {
      this.props.handleEditDialog(false);
      this.props.handleFetchBooks();
    });
    toast.success(this.props.t("Edition successful"));
    this.props.handleActionDialog(false);
  };
  render() {
    return (
      <div className="edit-dialog-container">
        <div className="edit-dialog-title">
          <Trans>Edit Book</Trans>
        </div>
        <div className="edit-dialog-book-name-container">
          <div className="edit-dialog-book-name-text">
            <Trans>Book name</Trans>
          </div>
          <input className="edit-dialog-book-name-box" />
        </div>
        <div className="edit-dialog-book-author-container">
          <div className="edit-dialog-book-author-text">
            <Trans>Author</Trans>
          </div>
          <input className="edit-dialog-book-author-box" />
        </div>
        <div className="add-dialog-button-container">
          <div
            className="add-dialog-cancel"
            onClick={() => {
              this.handleCancel();
            }}
          >
            <Trans>Cancel</Trans>
          </div>
          <div
            className="add-dialog-confirm"
            onClick={() => {
              this.handleComfirm();
            }}
          >
            <Trans>Confirm</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default EditDialog;
