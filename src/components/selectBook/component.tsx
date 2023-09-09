import React from "react";
import AddFavorite from "../../utils/readUtils/addFavorite";
import BookModel from "../../model/Book";
import { Trans } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
import { withRouter } from "react-router-dom";
import toast from "react-hot-toast";
import {
  exportBooks,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../utils/syncUtils/exportUtil";
import BookUtil from "../../utils/fileUtils/bookUtil";
declare var window: any;
class SelectBook extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {
      isOpenDelete: false,
      favoriteBooks: Object.keys(AddFavorite.getAllFavorite()).length,
    };
  }

  render() {
    return (
      <div
        className="booklist-manage-container"
        style={this.props.isCollapsed ? { left: "75px" } : {}}
      >
        <span
          onClick={() => {
            this.props.handleSelectBook(!this.props.isSelectBook);
            if (this.props.isSelectBook) {
              this.props.handleSelectedBooks([]);
            }
          }}
          className="book-manage-title"
          style={{ color: "#0078d4" }}
        >
          <Trans>{this.props.isSelectBook ? "Cancel" : ""}</Trans>
        </span>
        {this.props.isSelectBook && (
          <>
            <span
              className="book-manage-title"
              onClick={() => {
                this.props.handleAddDialog(true);
              }}
            >
              <Trans>Add to Shelf</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                this.props.handleDeleteDialog(true);
              }}
            >
              <Trans>Delete</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={async () => {
                if (
                  this.props.books.filter(
                    (item: BookModel) =>
                      this.props.selectedBooks.indexOf(item.key) > -1
                  ).length > 0
                ) {
                  await exportBooks(
                    this.props.books.filter(
                      (item: BookModel) =>
                        this.props.selectedBooks.indexOf(item.key) > -1
                    )
                  );
                  toast.success(this.props.t("Export Successfully"));
                } else {
                  toast(this.props.t("Nothing to export"));
                }
              }}
            >
              <Trans>Export Books</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={async () => {
                let selectedBooks = this.props.books.filter(
                  (item: BookModel) =>
                    this.props.selectedBooks.indexOf(item.key) > -1
                );
                if (
                  this.props.notes.filter(
                    (item) =>
                      selectedBooks.filter(
                        (subitem) => subitem.key === item.bookKey
                      ).length > 0 && item.notes !== ""
                  ).length > 0
                ) {
                  exportNotes(
                    this.props.notes.filter(
                      (item) =>
                        selectedBooks.filter(
                          (subitem) => subitem.key === item.bookKey
                        ).length > 0 && item.notes !== ""
                    ),
                    selectedBooks
                  );
                  toast.success(this.props.t("Export Successfully"));
                } else {
                  toast(this.props.t("Nothing to export"));
                }
              }}
            >
              <Trans>Export Notes</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={async () => {
                let selectedBooks = this.props.books.filter(
                  (item: BookModel) =>
                    this.props.selectedBooks.indexOf(item.key) > -1
                );
                if (
                  this.props.notes.filter(
                    (item) =>
                      selectedBooks.filter(
                        (subitem) => subitem.key === item.bookKey
                      ).length > 0 && item.notes === ""
                  ).length > 0
                ) {
                  exportHighlights(
                    this.props.notes.filter(
                      (item) =>
                        selectedBooks.filter(
                          (subitem) => subitem.key === item.bookKey
                        ).length > 0 && item.notes === ""
                    ),
                    selectedBooks
                  );
                  toast.success(this.props.t("Export Successfully"));
                } else {
                  toast(this.props.t("Nothing to export"));
                }
              }}
            >
              <Trans>Export Highlights</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={async () => {
                let selectedBooks = this.props.books.filter(
                  (item: BookModel) =>
                    this.props.selectedBooks.indexOf(item.key) > -1
                );
                let dictHistory =
                  (await window.localforage.getItem("words")) || [];
                dictHistory = dictHistory.filter(
                  (item) =>
                    selectedBooks.filter(
                      (subitem) => subitem.key === item.bookKey
                    ).length > 0
                );
                if (dictHistory.length > 0) {
                  exportDictionaryHistory(dictHistory, selectedBooks);
                  toast.success(this.props.t("Export Successfully"));
                } else {
                  toast(this.props.t("Nothing to export"));
                }
              }}
            >
              <Trans>Export Dictionary History</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={async () => {
                if (
                  this.props.books.filter(
                    (item: BookModel) =>
                      this.props.selectedBooks.indexOf(item.key) > -1
                  ).length > 0
                ) {
                  let selectedBooks = this.props.books.filter(
                    (item: BookModel) =>
                      this.props.selectedBooks.indexOf(item.key) > -1
                  );
                  if (selectedBooks.length === 0) {
                    toast(this.props.t("Nothing to precache"));
                    return;
                  }
                  for (let index = 0; index < selectedBooks.length; index++) {
                    const selectedBook = selectedBooks[index];
                    if (selectedBook.format === "PDF") {
                      toast(this.props.t("Not supported yet"));
                    } else {
                      toast(this.props.t("Precaching"));
                    }

                    let result = await BookUtil.fetchBook(
                      selectedBook.key,
                      true,
                      selectedBook.path
                    );
                    let rendition = BookUtil.getRendtion(
                      result,
                      selectedBook.format,
                      "",
                      selectedBook.charset
                    );
                    let cache = await rendition.preCache(result);
                    if (cache !== "err") {
                      BookUtil.addBook("cache-" + selectedBook.key, cache);
                      toast.success(this.props.t("Precaching Successfully"));
                    } else {
                      toast.error(this.props.t("Precaching failed"));
                    }
                  }
                } else {
                  toast(this.props.t("Nothing to precache"));
                }
              }}
            >
              <Trans>Precache</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={async () => {
                let selectedBooks = this.props.books.filter(
                  (item: BookModel) =>
                    this.props.selectedBooks.indexOf(item.key) > -1
                );
                if (selectedBooks.length === 0) {
                  toast(this.props.t("Nothing to delete"));
                  return;
                }
                for (let index = 0; index < selectedBooks.length; index++) {
                  const selectedBook = selectedBooks[index];
                  await BookUtil.deleteBook("cache-" + selectedBook.key);
                  toast.success(this.props.t("Delete Successfully"));
                }
              }}
            >
              <Trans>Delete Precache</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                if (
                  this.props.selectedBooks.length === this.props.books.length
                ) {
                  this.props.handleSelectedBooks([]);
                } else {
                  this.props.handleSelectedBooks(
                    this.props.books.map((item) => item.key)
                  );
                }
              }}
            >
              {this.props.selectedBooks.length === this.props.books.length ? (
                <Trans>Deselect All</Trans>
              ) : (
                <Trans>Select All</Trans>
              )}
            </span>{" "}
          </>
        )}
      </div>
    );
  }
}

export default withRouter(SelectBook as any);
