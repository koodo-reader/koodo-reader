import { useEffect, useState } from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookCoverItem from "../../../components/bookCoverItem";
import BookListItem from "../../../components/bookListItem";
import CollectionItem from "../../../components/collectionItem";
import BookModel from "../../../models/Book";
import { Trans } from "react-i18next";
import { BookListProps } from "./interface";
import ViewMode from "../../../components/viewMode";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import EmptyPage from "../../emptyPage";
import { useAppStore } from "../../../store/useAppStore";

const collectionUtil = new CollectionUtil(ConfigService);

const BookList = (props: BookListProps) => {
  const deletedBooks = useAppStore((s) => s.manager.deletedBooks);
  const isCollapsed = useAppStore((s) => s.sidebar.isCollapsed);
  const viewMode = useAppStore((s) => s.manager.viewMode);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const handleDeleteDialog = useAppStore((s) => s.handleDeleteDialog);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const [fullBooksData, setFullBooksData] = useState<BookModel[]>([]);

  useEffect(() => {
    handleFetchBooks();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDeletedBooks = async () => {
      let nextFullBooksData: BookModel[] = [];
      for (let i = 0; i < deletedBooks.length; i++) {
        let book = deletedBooks[i];
        if (collectionUtil.isCollection(book.key)) {
          let collection = collectionUtil.getCollection(book.key);
          if (collection) {
            nextFullBooksData.push(
              collectionUtil.getCollectionAsBook(collection)
            );
          }
          continue;
        }
        let fullBook = await DatabaseService.getRecord(book.key, "books");
        if (fullBook) {
          nextFullBooksData.push(fullBook);
        }
      }
      if (!cancelled) {
        setFullBooksData(nextFullBooksData);
      }
    };
    loadDeletedBooks();
    return () => {
      cancelled = true;
    };
  }, [deletedBooks]);

  const renderBookList = () => {
    let books = fullBooksData;
    return books.map((item: BookModel, index: number) => {
      if (collectionUtil.isCollection(item.key)) {
        const collection = collectionUtil.getCollection(item.key);
        if (!collection) return null;
        return viewMode === "list" ? (
          <CollectionItem
            key={index}
            {...({
              collection,
              viewMode: "list",
              isSelected: selectedBooks.indexOf(item.key) > -1,
            } as any)}
          />
        ) : viewMode === "card" ? (
          <CollectionItem
            key={index}
            {...({
              collection,
              viewMode: "card",
              isSelected: selectedBooks.indexOf(item.key) > -1,
            } as any)}
          />
        ) : (
          <CollectionItem
            key={index}
            {...({
              collection,
              viewMode: "cover",
              isSelected: selectedBooks.indexOf(item.key) > -1,
            } as any)}
          />
        );
      }
      if (!item.format || item.format === "COLLECTION") {
        return null;
      }
      return viewMode === "list" ? (
        <BookListItem
          {...{
            key: index,
            book: item,
          }}
        />
      ) : viewMode === "card" ? (
        <BookCardItem
          {...{
            key: index,
            book: item,
            isSelected: selectedBooks.indexOf(item.key) > -1,
          }}
        />
      ) : (
        <BookCoverItem
          {...{
            key: index,
            book: item,
            isSelected: selectedBooks.indexOf(item.key) > -1,
          }}
        />
      );
    });
  };

  return (
    <>
      {fullBooksData.length > 0 ? (
        <div
          className="book-list-container-parent"
          style={
            isCollapsed
              ? { width: "calc(100vw - 70px)", left: "70px" }
              : {}
          }
        >
          <div className="book-list-container">
            <ul className="book-list-item-box">{renderBookList()}</ul>
          </div>
        </div>
      ) : (
        <EmptyPage />
      )}
      {fullBooksData.length > 0 ? (
        <div
          className="book-list-header"
          style={
            isCollapsed
              ? { width: "calc(100% - 70px)", left: "70px" }
              : {}
          }
        >
          <div></div>
          <div
            className="booklist-delete-container"
            onClick={() => {
              handleDeleteDialog(true);
            }}
            style={isCollapsed ? { left: "calc(50% - 60px)" } : {}}
          >
            <Trans>Delete all books</Trans>
          </div>
          <ViewMode />
        </div>
      ) : null}
    </>
  );
};

export default BookList;
