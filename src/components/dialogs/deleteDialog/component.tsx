import { useState } from "react";
import "./deleteDialog.css";
import { Trans } from "react-i18next";
import { DeleteDialogProps } from "./interface";
import { withRouter } from "react-router-dom";
import BookUtil from "../../../utils/file/bookUtil";
import toast from "react-hot-toast";
import CoverUtil from "../../../utils/file/coverUtil";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";

const collectionUtil = new CollectionUtil(ConfigService);

const DeleteDialog = (props: DeleteDialogProps) => {
  const [isDeleteShelfBook, setIsDeleteShelfBook] = useState(
    ConfigService.getReaderConfig("isDeleteShelfBook") === "yes"
  );
  const [isDisableTrashBin, setIsDisableTrashBin] = useState(
    ConfigService.getReaderConfig("isDisableTrashBin") === "yes"
  );

  const handleCancel = () => {
    props.handleDeleteDialog(false);
  };

  const deleteKeyFromShelf = (key: string) => {
    ConfigService.deleteFromMapConfig(props.shelfTitle, key, "shelfList");
    if (collectionUtil.isCollection(key)) {
      let collection = collectionUtil.getCollection(key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteFromMapConfig(
            props.shelfTitle,
            bookKey,
            "shelfList"
          );
        });
      }
    }
  };

  const deleteBookFromShelf = () => {
    if (props.isSelectBook) {
      props.selectedBooks.forEach((item) => {
        deleteKeyFromShelf(item);
      });
      props.handleSelectedBooks([]);
      props.handleFetchBooks();
      props.handleSelectBook(!props.isSelectBook);
      props.handleDeleteDialog(false);
      toast.success(props.t("Deletion successful"), {
        id: "delete-books",
      });
      return;
    }
    deleteKeyFromShelf(props.currentBook.key);
  };

  const deleteBook = (key: string, format: string) => {
    return new Promise<void>(async (resolve, reject) => {
      if (collectionUtil.isCollection(key)) {
        collectionUtil.dissolveCollection(key);
        resolve();
        return;
      }
      if (
        ConfigService.getReaderConfig("isDeleteOriginal") === "yes" &&
        isElectron
      ) {
        let fullBook = await DatabaseService.getRecord(key, "books");
        if (fullBook) {
          const fs = window.electronAPI.fs;
          let bookPath = fullBook.path;
          if (fs.existsSync(bookPath)) {
            fs.unlinkSync(bookPath);
          }
        }
      }
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
          ConfigService.deleteObjectConfig(key, "pdfCrop");
          ConfigService.deleteObjectConfig(key, "readingTime");
          collectionUtil.removeBooksFromAllCollections([key]);
          await DatabaseService.deleteRecordsByBookKey(key, "bookmarks");
          await DatabaseService.deleteRecordsByBookKey(key, "notes");
          resolve();
        })
        .catch((err) => {
          toast.error("Delete book error: " + err.message, {
            id: "delete-books",
          });
          console.error(err);
          reject(err);
        });
    });
  };

  const deleteAllBookInTrash = async () => {
    toast.loading(props.t("Deleting..."), {
      id: "delete-books",
    });
    let keyArr = ConfigService.getAllListConfig("deletedBooks");
    let fullDeteletedBooks: any[] = [];
    for (let i = 0; i < props.deletedBooks.length; i++) {
      let deletedBook = await DatabaseService.getRecord(
        props.deletedBooks[i].key,
        "books"
      );
      if (deletedBook) {
        fullDeteletedBooks.push(deletedBook);
      }
    }
    for (let i = 0; i < keyArr.length; i++) {
      let format = fullDeteletedBooks
        .find((item) => item.key === keyArr[i])
        ?.format.toLowerCase();
      await deleteBook(keyArr[i], format || "epub");
    }
    if (props.books.length === 0) {
      props.history.push("/manager/empty");
    }
    props.handleFetchBooks();
    props.handleFetchBookmarks();
    props.handleFetchNotes();
  };

  const deleteSelectedBook = () => {
    props.selectedBooks.forEach((item) => {
      ConfigService.setListConfig(item, "deletedBooks");
      ConfigService.deleteListConfig(item, "favoriteBooks");
    });
    collectionUtil.removeBooksFromAllCollections(
      props.selectedBooks.filter((item) => {
        return !collectionUtil.isCollection(item);
      })
    );
    props.handleSelectedBooks([]);
    props.handleFetchBooks();
    props.handleSelectBook(!props.isSelectBook);
  };

  const deleteCurrentBook = () => {
    ConfigService.setListConfig(props.currentBook.key, "deletedBooks");
    ConfigService.deleteListConfig(props.currentBook.key, "favoriteBooks");
    if (!collectionUtil.isCollection(props.currentBook.key)) {
      collectionUtil.removeBooksFromAllCollections([props.currentBook.key]);
    }
    props.handleFetchBooks();
  };

  const deleteBooks = () => {
    if (props.isSelectBook) {
      deleteSelectedBook();
    } else {
      deleteCurrentBook();
    }
  };

  const handleComfirm = async () => {
    if (
      props.mode === "shelf" &&
      !isDeleteShelfBook &&
      !isDisableTrashBin
    ) {
      deleteBookFromShelf();
    } else if (props.mode === "trash") {
      await deleteAllBookInTrash();
    } else if (isDisableTrashBin) {
      deleteBooks();
      await deleteAllBookInTrash();
    } else {
      deleteBooks();
    }
    if (props.isSearch) {
      props.handleSearch(false);
    }
    props.handleDeleteDialog(false);
    toast.success(props.t("Deletion successful"), {
      id: "delete-books",
    });
  };

  const isCollection = collectionUtil.isCollection(
    props.currentBook?.key || ""
  );
  return (
    <div className="delete-dialog-container">
      {props.mode === "shelf" && !isDeleteShelfBook ? (
        <div className="delete-dialog-title">
          <Trans>Delete from shelf</Trans>
        </div>
      ) : props.mode === "trash" ? (
        <div className="delete-dialog-title">
          <Trans>Delete all books</Trans>
        </div>
      ) : isCollection ? (
        <div className="delete-dialog-title">
          <Trans>Delete collection</Trans>
        </div>
      ) : (
        <div className="delete-dialog-title">
          <Trans>Delete this book</Trans>
        </div>
      )}
      {props.mode === "trash" ? null : (
        <div className="delete-dialog-book">
          <div className="delete-dialog-book-title">
            {props.isSelectBook ? (
              <Trans i18nKey="Total books" count={props.selectedBooks.length}>
                {"Total " + props.selectedBooks.length + " books"}
              </Trans>
            ) : (
              props.currentBook.name
            )}
          </div>
        </div>
      )}

      {props.mode === "shelf" && !isDeleteShelfBook ? (
        <div className="delete-dialog-other-option" style={{ top: "100px" }}>
          <Trans>This action won't delete the original book</Trans>
        </div>
      ) : props.mode === "trash" ? (
        <div className="delete-dialog-other-option" style={{ top: "80px" }}>
          <Trans>
            This action will remove all the books in recycle bin,together with
            their notes, bookmarks and digests
          </Trans>
        </div>
      ) : isDisableTrashBin ? (
        <div className="delete-dialog-other-option" style={{ top: "100px" }}>
          <Trans>
            This action will permanently delete the selected books, together
            with their notes, bookmarks and digests
          </Trans>
        </div>
      ) : isCollection ? (
        <div className="delete-dialog-other-option" style={{ top: "100px" }}>
          <Trans>
            This action will move this collection to the recycle bin, the books
            inside will be kept in your library
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
            handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="add-dialog-confirm"
          onClick={() => {
            handleComfirm();
          }}
        >
          <Trans>Delete</Trans>
        </div>
      </div>
    </div>
  );
};

export default withRouter(DeleteDialog as any);
