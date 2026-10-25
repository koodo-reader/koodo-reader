import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import "./collectionDetailDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import BookCardItem from "../../bookCardItem";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../../utils/storage/databaseService";
import BookModel from "../../../models/Book";
import { useAppStore } from "../../../store/useAppStore";

const collectionUtil = new CollectionUtil(ConfigService);

const CollectionDetailDialog = () => {
  const currentCollectionKey = useAppStore((s) => s.collection.currentCollectionKey);
  const handleCollectionDetailDialog = useAppStore(
    (s) => s.handleCollectionDetailDialog
  );
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const { t } = useTranslation();
  const [books, setBooks] = useState<BookModel[]>([]);

  const loadBooks = async () => {
    let collection = collectionUtil.getCollection(currentCollectionKey);
    if (!collection) {
      setBooks([]);
      return;
    }
    let loadedBooks: BookModel[] = [];
    let keys = [...collection.books].reverse();
    for (let i = 0; i < keys.length; i++) {
      let book = await DatabaseService.getRecord(keys[i], "books");
      if (book) {
        loadedBooks.push(book);
      }
    }
    setBooks(loadedBooks);
  };

  useEffect(() => {
    loadBooks();
  }, [currentCollectionKey]);

  const handleCancel = () => {
    handleCollectionDetailDialog(false);
  };

  const handleRemoveBook = (event: React.MouseEvent, book: BookModel) => {
    event.stopPropagation();
    collectionUtil.removeBooksFromCollection(currentCollectionKey, [
      book.key,
    ]);
    toast.success(t("Modification successful"));
    loadBooks();
    handleFetchBooks();
  };

  let collection = collectionUtil.getCollection(currentCollectionKey);
  if (!collection) {
    return null;
  }
  return (
    <div className="collection-detail-dialog-container">
      <div
        className="collection-detail-dialog-close-container"
        onClick={() => {
          handleCancel();
        }}
      >
        <span className="icon-close collection-detail-dialog-close"></span>
      </div>
      <div className="collection-detail-dialog-body">
        {books.length === 0 ? (
          <div className="collection-detail-dialog-empty">
            <span className="icon-folder collection-detail-dialog-empty-icon"></span>
            <p>
              <Trans>Empty</Trans>
            </p>
          </div>
        ) : (
          books.map((book) => {
            return (
              <div className="collection-detail-book-wrapper" key={book.key}>
                <BookCardItem
                  {...({
                    book,
                    cardScale: 1,
                    isSelected: false,
                  } as any)}
                />
                <span
                  className="icon-close collection-detail-book-remove"
                  title={t("Remove from collection")}
                  onClick={(event) => {
                    handleRemoveBook(event, book);
                  }}
                ></span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CollectionDetailDialog;
