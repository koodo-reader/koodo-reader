//编辑图书对话框
import React from "react";
import { connect } from "react-redux";
import "./editDialog.css";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
} from "../../redux/manager.redux";
import { handleEditDialog } from "../../redux/book.redux";
import localforage from "localforage";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import HighligherModel from "../../model/Highlighter";
import BookmarkModel from "../../model/Bookmark";
import { stateType } from "../../store";

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
    this.props.handleMessage("编辑成功");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="edit-dialog-container">
        <div className="edit-dialog-title">编辑图书</div>
        <div className="edit-dialog-book-name-container">
          <div className="edit-dialog-book-name-text">书名</div>
          <input className="edit-dialog-book-name-box" />
        </div>
        <div className="edit-dialog-book-author-container">
          <div className="edit-dialog-book-author-text">作者</div>
          <input className="edit-dialog-book-author-box" />
        </div>
        <div
          className="edit-dialog-cancel"
          onClick={() => {
            this.handleCancel();
          }}
        >
          取消
        </div>
        <div
          className="edit-dialog-comfirm"
          onClick={() => {
            this.handleComfirm();
          }}
        >
          确认
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
export default connect(mapStateToProps, actionCreator)(EditDialog);
