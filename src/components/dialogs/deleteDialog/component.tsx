import React from "react";
import "./deleteDialog.css";
import { Trans } from "react-i18next";
import { DeleteDialogProps, DeleteDialogState } from "./interface";
import { withRouter } from "react-router-dom";
import BookUtil from "../../../utils/file/bookUtil";
import toast from "react-hot-toast";
import CoverUtil from "../../../utils/file/coverUtil";
import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

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
  handleComfirm = async () => {
    if (
      this.props.mode === "shelf" &&
      !this.state.isDeleteShelfBook &&
      !this.state.isDisableTrashBin
    ) {
      this.deleteBookFromShelf();
    } else if (this.props.mode === "trash") {
      await this.deleteAllBookInTrash();
    } else if (this.state.isDisableTrashBin) {
      this.deleteBooks();
      await this.deleteAllBookInTrash();
    } else {
      this.deleteBooks();
    }
    if (this.props.isSearch) {
      this.props.handleSearch(false);
    }
    this.props.handleDeleteDialog(false);
    toast.success(this.props.t("Deletion successful"));
  };
  deleteBookFromShelf = () => {
    if (this.props.isSelectBook) {
      this.props.selectedBooks.forEach((item) => {
        ConfigService.deleteFromMapConfig(
          this.props.shelfTitle,
          item,
          "shelfList"
        );
      });
      this.props.handleSelectedBooks([]);
      this.props.handleFetchBooks();
      this.props.handleSelectBook(!this.props.isSelectBook);
      this.props.handleDeleteDialog(false);
      toast.success(this.props.t("Deletion successful"));
      return;
    }
    ConfigService.deleteFromMapConfig(
      this.props.shelfTitle,
      this.props.currentBook.key,
      "shelfList"
    );
  };
  deleteAllBookInTrash = async () => {
    let keyArr = ConfigService.getAllListConfig("deletedBooks");
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
      ConfigService.setListConfig(item, "deletedBooks");
      ConfigService.deleteListConfig(item, "favoriteBooks");
    });
    this.props.handleSelectedBooks([]);
    this.props.handleFetchBooks();
    this.props.handleSelectBook(!this.props.isSelectBook);
  };
  deleteCurrentBook = () => {
    ConfigService.setListConfig(this.props.currentBook.key, "deletedBooks");
    ConfigService.deleteListConfig(this.props.currentBook.key, "favoriteBooks");
    this.props.handleFetchBooks();
  };
  deleteBook = (key: string, format: string) => {
    return new Promise<void>((resolve, reject) => {
      DatabaseService.deleteRecord(key, "books")
        .then(async () => {
          await BookUtil.deleteBook(key, format);
          await CoverUtil.deleteCover(key);
          await BookUtil.deleteBook("cache-" + key, "zip");
          ConfigService.deleteListConfig(key, "favoriteBooks");
          ConfigService.deleteListConfig(key, "deletedBooks");
          ConfigService.deleteFromAllMapConfig(key, "shelfList");
          ConfigService.deleteListConfig(key, "recentBooks");
          ConfigService.deleteObjectConfig(key, "recordLocation");
          ConfigService.deleteObjectConfig(key, "readingTime");
          await DatabaseService.deleteRecordsByBookKey(key, "bookmarks");
          await DatabaseService.deleteRecordsByBookKey(key, "notes");
          resolve();
        })
        .catch((err) => {
          console.error(err);
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
