//编辑图书对话框
import React, { Component } from "react";
import { connect } from "react-redux";
import "./editDialog.css";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage
} from "../../redux/manager.redux";
import { handleEditDialog } from "../../redux/book.redux";
import localforage from "localforage";
class editDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { isCheck: false };
  }
  componentDidMount() {
    let nameBox = document.querySelector(".edit-dialog-book-name-box");
    let authorBox = document.querySelector(".edit-dialog-book-author-box");
    console.log(this.props.currentBook);
    nameBox.value = this.props.currentBook.name;
    authorBox.value = this.props.currentBook.author;
  }

  handleCancel = () => {
    this.props.handleEditDialog(false);
  };
  handleComfirm = () => {
    let name = document.querySelector(".edit-dialog-book-name-box").value;
    let author = document.querySelector(".edit-dialog-book-author-box").value;
    let { books } = this.props;
    books.forEach(item => {
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
const mapStateToProps = state => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters
  };
};
const actionCreator = {
  handleFetchBooks,
  handleEditDialog,
  handleMessageBox,
  handleMessage
};
editDialog = connect(mapStateToProps, actionCreator)(editDialog);
export default editDialog;
