import { useEffect, useState } from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookCoverItem from "../../../components/bookCoverItem";
import BookListItem from "../../../components/bookListItem";
import CollectionItem from "../../../components/collectionItem";
import BookModel from "../../../models/Book";
import { Trans } from "react-i18next";
import { BookListProps } from "./interface";
import { withRouter } from "react-router-dom";
import ViewMode from "../../../components/viewMode";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import EmptyPage from "../../emptyPage";

const collectionUtil = new CollectionUtil(ConfigService);

const BookList = (props: BookListProps) => {
  const [fullBooksData, setFullBooksData] = useState<BookModel[]>([]);

  useEffect(() => {
    props.handleFetchBooks();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDeletedBooks = async () => {
      let nextFullBooksData: BookModel[] = [];
      for (let i = 0; i < props.deletedBooks.length; i++) {
        let book = props.deletedBooks[i];
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
  }, [props.deletedBooks]);

  const renderBookList = () => {
    let books = fullBooksData;
    return books.map((item: BookModel, index: number) => {
      if (collectionUtil.isCollection(item.key)) {
        const collection = collectionUtil.getCollection(item.key);
        if (!collection) return null;
        return props.viewMode === "list" ? (
          <CollectionItem
            key={index}
            {...({
              collection,
              viewMode: "list",
              isSelected: props.selectedBooks.indexOf(item.key) > -1,
            } as any)}
          />
        ) : props.viewMode === "card" ? (
          <CollectionItem
            key={index}
            {...({
              collection,
              viewMode: "card",
              isSelected: props.selectedBooks.indexOf(item.key) > -1,
            } as any)}
          />
        ) : (
          <CollectionItem
            key={index}
            {...({
              collection,
              viewMode: "cover",
              isSelected: props.selectedBooks.indexOf(item.key) > -1,
            } as any)}
          />
        );
      }
      if (!item.format || item.format === "COLLECTION") {
        return null;
      }
      return props.viewMode === "list" ? (
        <BookListItem
          {...{
            key: index,
            book: item,
          }}
        />
      ) : props.viewMode === "card" ? (
        <BookCardItem
          {...{
            key: index,
            book: item,
            isSelected: props.selectedBooks.indexOf(item.key) > -1,
          }}
        />
      ) : (
        <BookCoverItem
          {...{
            key: index,
            book: item,
            isSelected: props.selectedBooks.indexOf(item.key) > -1,
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
            props.isCollapsed
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
            props.isCollapsed
              ? { width: "calc(100% - 70px)", left: "70px" }
              : {}
          }
        >
          <div></div>
          <div
            className="booklist-delete-container"
            onClick={() => {
              props.handleDeleteDialog(true);
            }}
            style={props.isCollapsed ? { left: "calc(50% - 60px)" } : {}}
          >
            <Trans>Delete all books</Trans>
          </div>
          <ViewMode />
        </div>
      ) : null}
    </>
  );
};

export default withRouter(BookList as any);
