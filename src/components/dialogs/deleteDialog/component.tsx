import React from "react";
import "./deleteDialog.css";
import ShelfUtil from "../../../utils/reader/shelfUtil";
import RecordRecent from "../../../utils/reader/recordRecent";
import RecordLocation from "../../../utils/reader/recordLocation";
import AddFavorite from "../../../utils/reader/addFavorite";
import { Trans } from "react-i18next";
import { DeleteDialogProps, DeleteDialogState } from "./interface";
import { withRouter } from "react-router-dom";
import AddTrash from "../../../utils/reader/addTrash";
import BookUtil from "../../../utils/file/bookUtil";
import toast from "react-hot-toast";
import ConfigService from "../../../utils/service/configService";
import NoteService from "../../../utils/service/noteService";
import BookmarkService from "../../../utils/service/bookmarkService";
import BookService from "../../../utils/service/bookService";
import CoverUtil from "../../../utils/file/coverUtil";

class DeleteDialog extends React.Component<
  DeleteDialogProps,
  DeleteDialogState
> {
  constructor(props: DeleteDialogProps) {
    super(props);
    this.state = {
      isDeleteShelfBook:
        ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
      isDisableTrashBin:
        ConfigService.getReaderConfig("isDisableTrashBin") === "yes",
    };
  }
  handleCancel = () => {
    this.props.handleDeleteDialog(false);
  };
  handleDeleteOther = async (key: string) => {
    await BookmarkService.deleteBookmarksByBookKey(key);
    this.props.handleFetchBookmarks();
    await NoteService.deleteNotesByBookKey(key);
    this.props.handleFetchNotes();
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
      let format = this.props.deletedBooks
        .find((item) => item.key === keyArr[i])
        ?.format.toLowerCase();
      await this.deleteBook(keyArr[i], format || "epub");
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
  deleteBook = (key: string, format: string) => {
    return new Promise<void>((resolve, reject) => {
      BookService.deleteBook(key)
        .then(async () => {
          await BookUtil.deleteBook(key, format);
          CoverUtil.deleteCover(key);
          await BookUtil.deleteBook("cache-" + key, "zip");
          AddFavorite.clear(key);
          AddTrash.clear(key);
          ShelfUtil.deletefromAllShelf(key);
          RecordRecent.clear(key);
          RecordLocation.clear(key);
          await this.handleDeleteOther(key);
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
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
            className="add-dialog-confirm"
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
