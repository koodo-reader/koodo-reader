import React from "react";
import "./deleteDialog.css";
import DeleteUtil from "../../../utils/readUtils/deleteUtil";

import ShelfUtil from "../../../utils/readUtils/shelfUtil";
import RecordRecent from "../../../utils/readUtils/recordRecent";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import AddFavorite from "../../../utils/readUtils/addFavorite";
import { Trans } from "react-i18next";
import { DeleteDialogProps, DeleteDialogState } from "./interface";
import { withRouter } from "react-router-dom";
import AddTrash from "../../../utils/readUtils/addTrash";
import BookUtil from "../../../utils/fileUtils/bookUtil";
import toast from "react-hot-toast";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
declare var window: any;
class DeleteDialog extends React.Component<
  DeleteDialogProps,
  DeleteDialogState
> {
  constructor(props: DeleteDialogProps) {
    super(props);
    this.state = {
      isDeleteShelfBook:
        StorageUtil.getReaderConfig("isDeleteShelfBook") === "yes",
      isDisableTrashBin:
        StorageUtil.getReaderConfig("isDisableTrashBin") === "yes",
    };
  }
  handleCancel = () => {
    this.props.handleDeleteDialog(false);
  };
  handleDeleteOther = (key: string) => {
    return new Promise<void>(async (resolve, reject) => {
      if (this.props.bookmarks) {
        let bookmarkArr = DeleteUtil.deleteBookmarks(this.props.bookmarks, key);
        if (bookmarkArr.length === 0) {
          await window.localforage.removeItem("bookmarks");
        } else {
          await window.localforage.setItem("bookmarks", bookmarkArr);
        }
        this.props.handleFetchBookmarks();
      }
      if (this.props.notes) {
        let noteArr = DeleteUtil.deleteNotes(this.props.notes, key);
        if (noteArr.length === 0) {
          await window.localforage.removeItem("notes");
          resolve();
        } else {
          await window.localforage.setItem("notes", noteArr);
          resolve();
        }
        this.props.handleFetchNotes();
      }
    });
  };
  handleComfirm = async () => {
    if (this.props.mode === "shelf" && !this.state.isDeleteShelfBook) {
      this.deleteBookFromShelf();
    } else if (this.props.mode === "trash") {
      await this.deleteAllBookInTrash();
    } else if (this.state.isDisableTrashBin) {
      this.deleteBooks();
      await this.deleteAllBookInTrash();
    } else {
      this.deleteBooks();
    }

    this.props.handleDeleteDialog(false);
    toast.success(this.props.t("Deletion successful"));
  };
  deleteBookFromShelf = () => {
    if (this.props.isSelectBook) {
      this.props.selectedBooks.forEach((item) => {
        ShelfUtil.clearShelf(this.props.shelfIndex, item);
      });
      this.props.handleSelectedBooks([]);
      this.props.handleFetchBooks();
      this.props.handleSelectBook(!this.props.isSelectBook);
      this.props.handleDeleteDialog(false);
      toast.success(this.props.t("Deletion successful"));
      return;
    }
    ShelfUtil.clearShelf(this.props.shelfIndex, this.props.currentBook.key);
  };
  deleteAllBookInTrash = async () => {
    let keyArr = AddTrash.getAllTrash();
    for (let i = 0; i < keyArr.length; i++) {
      await this.deleteBook(keyArr[i]);
    }

    if (this.props.books.length === 0) {
      this.props.history.push("/manager/empty");
    }
    this.props.handleFetchBooks();
    this.props.handleFetchBooks();
    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
  };
  deleteBooks = () => {
    if (this.props.isSelectBook) {
      this.deleteSelectedBook();
    } else {
      this.deleteCurrentBook();
    }
  };
  deleteSelectedBook = () => {
    this.props.selectedBooks.forEach((item) => {
      AddTrash.setTrash(item);
      AddFavorite.clear(item);
    });
    this.props.handleSelectedBooks([]);
    this.props.handleFetchBooks();
    this.props.handleSelectBook(!this.props.isSelectBook);
  };
  deleteCurrentBook = () => {
    AddTrash.setTrash(this.props.currentBook.key);
    AddFavorite.clear(this.props.currentBook.key);
    this.props.handleFetchBooks();
  };
  deleteBook = (key: string) => {
    return new Promise<void>((resolve, reject) => {
      this.props.books &&
        window.localforage
          .setItem("books", DeleteUtil.deleteBook(this.props.books, key))
          .then(async () => {
            await BookUtil.deleteBook(key);
            await BookUtil.deleteBook("cache-" + key);
            AddFavorite.clear(key);
            AddTrash.clear(key);
            ShelfUtil.deletefromAllShelf(key);
            RecordRecent.clear(key);
            RecordLocation.clear(key);
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
        {this.props.mode === "shelf" && !this.state.isDeleteShelfBook ? (
          <div className="delete-dialog-title">
            <Trans>Delete from shelf</Trans>
          </div>
        ) : this.props.mode === "trash" ? (
          <div className="delete-dialog-title">
            <Trans>Delete all books</Trans>
          </div>
        ) : (
          <div className="delete-dialog-title">
            <Trans>Delete this book</Trans>
          </div>
        )}
        {this.props.mode === "trash" ? null : (
          <div className="delete-dialog-book">
            <div className="delete-dialog-book-title">
              {this.props.isSelectBook ? (
                <Trans
                  i18nKey="Total books"
                  count={this.props.selectedBooks.length}
                >
                  {"Total " + this.props.selectedBooks.length + " books"}
                </Trans>
              ) : (
                this.props.currentBook.name
              )}
            </div>
          </div>
        )}

        {this.props.mode === "shelf" && !this.state.isDeleteShelfBook ? (
          <div className="delete-dialog-other-option" style={{ top: "100px" }}>
            <Trans>This action won't delete the original book</Trans>
          </div>
        ) : this.props.mode === "trash" ? (
          <div className="delete-dialog-other-option" style={{ top: "80px" }}>
            <Trans>
              This action will remove all the books in recycle bin,together with
              their notes, bookmarks and digests
            </Trans>
          </div>
        ) : this.state.isDisableTrashBin ? (
          <div className="delete-dialog-other-option" style={{ top: "100px" }}>
            <Trans>
              This action will permanently delete the selected books, together
              with their notes, bookmarks and digests
            </Trans>
          </div>
        ) : (
          <div className="delete-dialog-other-option" style={{ top: "100px" }}>
            <Trans>
              This action will move this book and its the notes, bookmarks and
              highlights of this book to the recycle bin
            </Trans>
          </div>
        )}
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
            className="add-dialog-comfirm"
            onClick={() => {
              this.handleComfirm();
            }}
          >
            <Trans>Delete</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(DeleteDialog as any);
