import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./deleteDialog.css";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
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

const DeleteDialog = () => {
  const books = useAppStore((s) => s.manager.books);
  const deletedBooks = useAppStore((s) => s.manager.deletedBooks);
  const isSearch = useAppStore((s) => s.manager.isSearch);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const mode = useAppStore((s) => s.sidebar.mode);
  const shelfTitle = useAppStore((s) => s.sidebar.shelfTitle);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const isSelectBook = useAppStore((s) => s.manager.isSelectBook);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleSelectBook = useAppStore((s) => s.handleSelectBook);
  const handleDeleteDialog = useAppStore((s) => s.handleDeleteDialog);
  const handleFetchBookmarks = useAppStore((s) => s.handleFetchBookmarks);
  const handleSelectedBooks = useAppStore((s) => s.handleSelectedBooks);
  const handleFetchNotes = useAppStore((s) => s.handleFetchNotes);
  const handleSearch = useAppStore((s) => s.handleSearch);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDeleteShelfBook, setIsDeleteShelfBook] = useState(
    ConfigService.getReaderConfig("isDeleteShelfBook") === "yes"
  );
  const [isDisableTrashBin, setIsDisableTrashBin] = useState(
    ConfigService.getReaderConfig("isDisableTrashBin") === "yes"
  );

  const handleCancel = () => {
    handleDeleteDialog(false);
  };

  const deleteKeyFromShelf = (key: string) => {
    ConfigService.deleteFromMapConfig(shelfTitle, key, "shelfList");
    if (collectionUtil.isCollection(key)) {
      let collection = collectionUtil.getCollection(key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteFromMapConfig(
            shelfTitle,
            bookKey,
            "shelfList"
          );
        });
      }
    }
  };

  const deleteBookFromShelf = () => {
    if (isSelectBook) {
      selectedBooks.forEach((item) => {
        deleteKeyFromShelf(item);
      });
      handleSelectedBooks([]);
      handleFetchBooks();
      handleSelectBook(!isSelectBook);
      handleDeleteDialog(false);
      toast.success(t("Deletion successful"), {
        id: "delete-books",
      });
      return;
    }
    deleteKeyFromShelf(currentBook.key);
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
    toast.loading(t("Deleting..."), {
      id: "delete-books",
    });
    let keyArr = ConfigService.getAllListConfig("deletedBooks");
    let fullDeteletedBooks: any[] = [];
    for (let i = 0; i < deletedBooks.length; i++) {
      let deletedBook = await DatabaseService.getRecord(
        deletedBooks[i].key,
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
    if (books.length === 0) {
      navigate("/manager/empty");
    }
    handleFetchBooks();
    handleFetchBookmarks();
    handleFetchNotes();
  };

  const deleteSelectedBook = () => {
    selectedBooks.forEach((item) => {
      ConfigService.setListConfig(item, "deletedBooks");
      ConfigService.deleteListConfig(item, "favoriteBooks");
    });
    collectionUtil.removeBooksFromAllCollections(
      selectedBooks.filter((item) => {
        return !collectionUtil.isCollection(item);
      })
    );
    handleSelectedBooks([]);
    handleFetchBooks();
    handleSelectBook(!isSelectBook);
  };

  const deleteCurrentBook = () => {
    ConfigService.setListConfig(currentBook.key, "deletedBooks");
    ConfigService.deleteListConfig(currentBook.key, "favoriteBooks");
    if (!collectionUtil.isCollection(currentBook.key)) {
      collectionUtil.removeBooksFromAllCollections([currentBook.key]);
    }
    handleFetchBooks();
  };

  const deleteBooks = () => {
    if (isSelectBook) {
      deleteSelectedBook();
    } else {
      deleteCurrentBook();
    }
  };

  const handleComfirm = async () => {
    if (
      mode === "shelf" &&
      !isDeleteShelfBook &&
      !isDisableTrashBin
    ) {
      deleteBookFromShelf();
    } else if (mode === "trash") {
      await deleteAllBookInTrash();
    } else if (isDisableTrashBin) {
      deleteBooks();
      await deleteAllBookInTrash();
    } else {
      deleteBooks();
    }
    if (isSearch) {
      handleSearch(false);
    }
    handleDeleteDialog(false);
    toast.success(t("Deletion successful"), {
      id: "delete-books",
    });
  };

  const isCollection = collectionUtil.isCollection(
    currentBook?.key || ""
  );
  return (
    <div className="delete-dialog-container">
      {mode === "shelf" && !isDeleteShelfBook ? (
        <div className="delete-dialog-title">
          <Trans>Delete from shelf</Trans>
        </div>
      ) : mode === "trash" ? (
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
      {mode === "trash" ? null : (
        <div className="delete-dialog-book">
          <div className="delete-dialog-book-title">
            {isSelectBook ? (
              <Trans i18nKey="Total books" count={selectedBooks.length}>
                {"Total " + selectedBooks.length + " books"}
              </Trans>
            ) : (
              currentBook.name
            )}
          </div>
        </div>
      )}

      {mode === "shelf" && !isDeleteShelfBook ? (
        <div className="delete-dialog-other-option" style={{ top: "100px" }}>
          <Trans>This action won't delete the original book</Trans>
        </div>
      ) : mode === "trash" ? (
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

export default DeleteDialog;
