//编辑图书对话框
import React from "react";
import "./editDialog.css";
import localforage from "localforage";
import { Trans } from "react-i18next";
import { EditDialogProps, EditDialogState } from "./interface";

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
    let { books } = this.props;
    books.forEach((item) => {
      if (item.key === this.props.currentBook.key) {
        item.name = name;
        item.author = author;
        return false;
      }
    });
    localforage.setItem("books", books).then(() => {
      this.props.handleEditDialog(false);
      this.props.handleFetchBooks();
    });
    this.props.handleMessage("Edit Successfully");
    this.props.handleMessageBox(true);
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
            <Trans>Book Name</Trans>
          </div>
          <input className="edit-dialog-book-name-box" />
        </div>
        <div className="edit-dialog-book-author-container">
          <div className="edit-dialog-book-author-text">
            <Trans>Author</Trans>
          </div>
          <input className="edit-dialog-book-author-box" />
        </div>
        <div
          className="edit-dialog-cancel"
          onClick={() => {
            this.handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="edit-dialog-comfirm"
          onClick={() => {
            this.handleComfirm();
          }}
        >
          <Trans>Confirm</Trans>
        </div>
      </div>
    );
  }
}

export default EditDialog;
