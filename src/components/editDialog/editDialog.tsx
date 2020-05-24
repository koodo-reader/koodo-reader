//编辑图书对话框
import React from "react";
import { connect } from "react-redux";
import "./editDialog.css";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
} from "../../redux/actions/manager";
import { handleEditDialog } from "../../redux/actions/book";
import localforage from "localforage";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import HighligherModel from "../../model/Highlighter";
import BookmarkModel from "../../model/Bookmark";
import { stateType } from "../../redux/store";
import { Trans, withNamespaces } from "react-i18next";

export interface EditDialogProps {
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleFetchBooks: () => void;
  handleEditDialog: (isShow: boolean) => void;
  books: BookModel[];
  notes: NoteModel[];
  digests: DigestModel[];
  highlighters: HighligherModel[];
  bookmarks: BookmarkModel[];
  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
}

export interface EditDialogState {
  isCheck: boolean;
}

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
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleEditDialog,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(EditDialog as any));
