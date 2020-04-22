import React, { Component } from "react";
import { connect } from "react-redux";
import "./deleteDialog.css";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
} from "../../redux/manager.redux";
import { handleDeleteDialog } from "../../redux/book.redux";
import {
  handleFetchBookmarks,
  handleFetchNotes,
  handleFetchDigests,
  handleFetchHighlighters,
} from "../../redux/reader.redux";
import DeleteUtil from "../../utils/deleteUtil";
import localforage from "localforage";
import ShelfUtil from "../../utils/shelfUtil";
import RecordRecent from "../../utils/recordRecent";
class DeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // isCheck: false
    };
  }
  handleCancel = () => {
    this.props.handleDeleteDialog(false);
  };
  handleDeleteOther = () => {
    if (this.props.bookmarks !== null) {
      let bookmarkArr = DeleteUtil.deleteBookmarks(
        this.props.bookmarks,
        this.props.currentBook.key
      );
      if (bookmarkArr.length === 0) {
        localforage.removeItem("bookmarks").then(() => {
          this.props.handleFetchBookmarks();
        });
      } else {
        localforage.setItem("bookmarks", bookmarkArr).then(() => {
          this.props.handleFetchBookmarks();
        });
      }
    }
    if (this.props.notes !== null) {
      let noteArr = DeleteUtil.deleteNotes(
        this.props.notes,
        this.props.currentBook.key
      );
      if (noteArr.length === 0) {
        localforage.removeItem("notes").then(() => {
          this.props.handleFetchNotes();
        });
      } else {
        localforage.setItem("notes", noteArr).then(() => {
          this.props.handleFetchNotes();
        });
      }
    }
    // console.log(this.props.notes, "notes");
    if (this.props.digests !== null) {
      let digestArr = DeleteUtil.deleteDigests(
        this.props.digests,
        this.props.currentBook.key
      );
      if (digestArr.length === 0) {
        localforage.removeItem("digests").then(() => {
          this.props.handleFetchDigests();
        });
      } else {
        localforage.setItem("digests", digestArr).then(() => {
          this.props.handleFetchDigests();
        });
      }
    }
    if (this.props.highlighters !== null) {
      let highlighterArr = DeleteUtil.deleteHighlighters(
        this.props.highlighters,
        this.props.currentBook.key
      );
      if (highlighterArr.length === 0) {
        localforage.removeItem("highlighters").then(() => {
          this.props.handleFetchHighlighters();
        });
      } else {
        localforage.setItem("highlighters", highlighterArr).then(() => {
          this.props.handleFetchHighlighters();
        });
      }
    }
    // console.log(this.props.digests, "digests");

    // console.log(this.props.highlighters, "highlighters");
  };
  handleComfirm = () => {
    //从列表删除和从图书库删除判断
    if (this.props.mode === "shelf") {
      ShelfUtil.clearShelf(this.props.shelfIndex, this.props.currentBook.key);
      this.props.handleDeleteDialog(false);
    } else {
      this.props.books !== null &&
        localforage
          .setItem(
            "books",
            DeleteUtil.deleteBook(this.props.books, this.props.currentBook.key)
          )
          .then(() => {
            this.props.handleDeleteDialog(false);
            this.props.handleFetchBooks();
          });
      // console.log(this.props.bookmarks, "bookmarks");
      //从书架删除
      ShelfUtil.deletefromAllShelf(this.props.currentBook.key);
      //从阅读记录删除
      RecordRecent.clear(this.props.currentBook.key);
      //删除书签，笔记，书摘，高亮
      this.handleDeleteOther();
    }

    this.props.handleMessage("删除成功");
    this.props.handleMessageBox(true);
  };
  // handleCheck = mode => {
  //   this.setState({ isCheck: mode });
  // };

  render() {
    return (
      <div className="delete-dialog-container">
        {this.props.mode !== "shelf" ? (
          <div className="delete-dialog-title">是否删除本图书</div>
        ) : (
          <div className="delete-dialog-title">从书架删除本书</div>
        )}

        <div className="delete-dialog-book">
          <div className="delete-dialog-book-title">
            {this.props.currentBook.name}
          </div>
        </div>
        {this.props.mode !== "shelf" ? (
          <div className="delete-dialog-other-option">
            同时删除本书所有的书签，笔记，书摘
          </div>
        ) : (
          <div className="delete-dialog-other-option">
            仅从此书架中删除本书，原图书不受影响
          </div>
        )}

        {
          // this.props.mode !== "shelf" &&
          // (this.state.isCheck ? (
          //   <span
          //     className="icon-check"
          //     onClick={() => {
          //       this.handleCheck(false);
          //     }}
          //   ></span>
          // ) : (
          //   <span
          //     className="delete-dialog-uncheck-icon"
          //     onClick={() => {
          //       this.handleCheck(true);
          //     }}
          //   ></span>
          // ))
        }
        <div
          className="delete-dialog-cancel"
          onClick={() => {
            this.handleCancel();
          }}
        >
          取消
        </div>
        <div
          className="delete-dialog-comfirm"
          onClick={() => {
            this.handleComfirm();
          }}
        >
          删除
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleDeleteDialog,
  handleFetchBookmarks,
  handleFetchNotes,
  handleFetchDigests,
  handleFetchHighlighters,
  handleMessageBox,
  handleMessage,
};
DeleteDialog = connect(mapStateToProps, actionCreator)(DeleteDialog);
export default DeleteDialog;
