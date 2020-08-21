import React from "react";
import "./deleteDialog.css";
import DeleteUtil from "../../utils/deleteUtil";
import localforage from "localforage";
import ShelfUtil from "../../utils/shelfUtil";
import RecordRecent from "../../utils/recordRecent";
import RecordLocation from "../../utils/recordLocation";
import { Trans } from "react-i18next";
import { DeleteDialogProps } from "./interface";

class DeleteDialog extends React.Component<DeleteDialogProps> {
  handleCancel = () => {
    this.props.handleDeleteDialog(false);
  };
  handleDeleteOther = () => {
    if (this.props.bookmarks) {
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
    if (this.props.notes) {
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
  };
  handleComfirm = () => {
    //从列表删除和从图书库删除判断
    if (this.props.mode === "shelf") {
      ShelfUtil.clearShelf(this.props.shelfIndex, this.props.currentBook.key);
      this.props.handleDeleteDialog(false);
    } else {
      this.props.books &&
        localforage
          .setItem(
            "books",
            DeleteUtil.deleteBook(this.props.books, this.props.currentBook.key)
          )
          .then(() => {
            this.props.handleDeleteDialog(false);
            this.props.handleFetchBooks();
          });
      //从书架删除
      ShelfUtil.deletefromAllShelf(this.props.currentBook.key);
      //从阅读记录删除
      RecordRecent.clear(this.props.currentBook.key);
      //删除阅读历史
      RecordLocation.clear(this.props.currentBook.key);
      //删除书签，笔记，书摘，高亮
      this.handleDeleteOther();
    }

    this.props.handleMessage("Delete Successfully");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="delete-dialog-container">
        {this.props.mode !== "shelf" ? (
          <div className="delete-dialog-title">
            <Trans>Delete This Book</Trans>
          </div>
        ) : (
          <div className="delete-dialog-title">
            <Trans>Delete from Shelf</Trans>
          </div>
        )}

        <div className="delete-dialog-book">
          <div className="delete-dialog-book-title">
            {this.props.currentBook.name}
          </div>
        </div>
        {this.props.mode !== "shelf" ? (
          <div className="delete-dialog-other-option">
            <Trans>
              This action will delete all the notes, bookmarks and digests of
              this book
            </Trans>
          </div>
        ) : (
          <div className="delete-dialog-other-option">
            <Trans>This action won't delete the original book</Trans>
          </div>
        )}
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

export default DeleteDialog;
