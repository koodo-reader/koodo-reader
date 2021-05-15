import React from "react";
import "./deleteDialog.css";
import DeleteUtil from "../../../utils/readUtils/deleteUtil";
import localforage from "localforage";
import ShelfUtil from "../../../utils/readUtils/shelfUtil";
import RecordRecent from "../../../utils/readUtils/recordRecent";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import AddFavorite from "../../../utils/readUtils/addFavorite";
import { Trans } from "react-i18next";
import { DeleteDialogProps } from "./interface";
import { withRouter } from "react-router-dom";
import AddTrash from "../../../utils/readUtils/addTrash";
import BookUtil from "../../../utils/bookUtil";

class DeleteDialog extends React.Component<DeleteDialogProps> {
  handleCancel = () => {
    this.props.handleDeleteDialog(false);
  };
  handleDeleteOther = (key: string) => {
    return new Promise<void>(async (resolve, reject) => {
      if (this.props.bookmarks[0]) {
        let bookmarkArr = DeleteUtil.deleteBookmarks(this.props.bookmarks, key);
        if (bookmarkArr.length === 0) {
          await localforage.removeItem("bookmarks");
        } else {
          await localforage.setItem("bookmarks", bookmarkArr);
        }
      }
      if (this.props.notes) {
        let noteArr = DeleteUtil.deleteNotes(this.props.notes, key);
        if (noteArr.length === 0) {
          await localforage.removeItem("notes");
          resolve();
        } else {
          await localforage.setItem("notes", noteArr);
          resolve();
        }
      }
    });
  };
  handleComfirm = async () => {
    //从列表删除和从图书库删除判断
    if (this.props.mode === "shelf") {
      ShelfUtil.clearShelf(this.props.shelfIndex, this.props.currentBook.key);
    } else if (this.props.mode === "trash") {
      let keyArr = AddTrash.getAllTrash();
      for (let item of keyArr) {
        await this.deleteBook(item);
      }

      if (this.props.books.length === 1) {
        this.props.history.push("/manager/empty");
      }
      this.props.handleFetchBooks(false);
      this.props.handleFetchBooks(true);
      this.props.handleFetchBookmarks();
      this.props.handleFetchNotes();
    } else {
      AddTrash.setTrash(this.props.currentBook.key);
      //从喜爱的图书中删除
      AddFavorite.clear(this.props.currentBook.key);
      this.props.handleFetchBooks(false);
    }

    this.props.handleDeleteDialog(false);
    this.props.handleMessage("Delete Successfully");
    this.props.handleMessageBox(true);
  };
  deleteBook = (key: string) => {
    return new Promise<void>((resolve, reject) => {
      this.props.books &&
        localforage
          .setItem("books", DeleteUtil.deleteBook(this.props.books, key))
          .then(async () => {
            await BookUtil.deleteBook(key);
            //从喜爱的图书中删除
            AddFavorite.clear(key);
            //从回收的图书中删除
            AddTrash.clear(key);
            //从书架删除
            ShelfUtil.deletefromAllShelf(key);
            //从阅读记录删除
            RecordRecent.clear(key);
            //删除阅读历史
            RecordLocation.clear(key);
            //删除书签，笔记，书摘，高亮
            await this.handleDeleteOther(key);
            resolve();
          })
          .catch(() => {
            reject();
          });
    });
  };
  render() {
    return (
      <div className="delete-dialog-container">
        {this.props.mode === "shelf" ? (
          <div className="delete-dialog-title">
            <Trans>Delete from Shelf</Trans>
          </div>
        ) : this.props.mode === "trash" ? (
          <div className="delete-dialog-title">
            <Trans>Delete All Books</Trans>
          </div>
        ) : (
          <div className="delete-dialog-title">
            <Trans>Delete This Book</Trans>
          </div>
        )}
        {this.props.mode === "trash" ? null : (
          <div className="delete-dialog-book">
            <div className="delete-dialog-book-title">
              {this.props.currentBook.name}
            </div>
          </div>
        )}

        {this.props.mode === "shelf" ? (
          <div className="delete-dialog-other-option">
            <Trans>This action won't delete the original book</Trans>
          </div>
        ) : this.props.mode === "trash" ? (
          <div className="delete-dialog-other-option" style={{ top: "80px" }}>
            <Trans>
              This action will remove all the books in recycle bin,together with
              their notes, bookmarks and digests
            </Trans>
          </div>
        ) : (
          <div className="delete-dialog-other-option">
            <Trans>
              This action will move this book and its the notes, bookmarks and
              digests of this book to the recycle bin
            </Trans>
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

export default withRouter(DeleteDialog);
