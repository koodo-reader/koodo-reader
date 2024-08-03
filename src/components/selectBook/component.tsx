import React from "react";
import AddFavorite from "../../utils/readUtils/addFavorite";
import BookModel from "../../models/Book";
import "./selectBook.css";
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
import ShelfUtil from "../../utils/readUtils/shelfUtil";
declare var window: any;
class SelectBook extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {
      isOpenDelete: false,
      isShowExport: false,
      favoriteBooks: Object.keys(AddFavorite.getAllFavorite()).length,
    };
  }
  handleFilterShelfBook = (items: BookModel[]) => {
    if (this.props.shelfIndex > 0) {
      if (this.props.shelfIndex < 1) return items;
      let shelfTitle = Object.keys(ShelfUtil.getShelf());
      let currentShelfTitle = shelfTitle[this.props.shelfIndex];
      if (!currentShelfTitle) return items;
      let currentShelfList = ShelfUtil.getShelf()[currentShelfTitle];
      let shelfItems = items.filter((item: BookModel) => {
        return currentShelfList.indexOf(item.key) > -1;
      });
      return shelfItems;
    } else {
      return items;
    }
  };
  handleShelf(items: any, index: number) {
    if (index < 1) return items;
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    let currentShelfTitle = shelfTitle[index];
    if (!currentShelfTitle) return items;
    let currentShelfList = ShelfUtil.getShelf()[currentShelfTitle];
    let shelfItems = items.filter((item: { key: number }) => {
      return currentShelfList.indexOf(item.key) > -1;
    });
    return shelfItems;
  }
  render() {
    return (
      <div
        className="booklist-manage-container"
        style={this.props.isCollapsed ? { left: "75px" } : {}}
      >
        {this.props.isSelectBook && (
          <>
            <span
              onClick={() => {
                this.props.handleSelectBook(!this.props.isSelectBook);
                if (this.props.isSelectBook) {
                  this.props.handleSelectedBooks([]);
                }
              }}
              className="book-manage-title"
              style={{ color: "rgb(231, 69, 69)" }}
            >
              <Trans>Cancel</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                if (
                  this.props.books.filter(
                    (item: BookModel) =>
                      this.props.selectedBooks.indexOf(item.key) > -1
                  ).length > 0
                ) {
                  AddFavorite.setFavorites(
                    this.props.books.filter(
                      (item: BookModel) =>
                        this.props.selectedBooks.indexOf(item.key) > -1
                    )
                  );
                  this.props.handleSelectBook(!this.props.isSelectBook);
                  if (this.props.isSelectBook) {
                    this.props.handleSelectedBooks([]);
                  }
                  toast.success(this.props.t("Add successful"));
                } else {
                  toast(this.props.t("Nothing to add"));
                }
              }}
            >
              <Trans>Add to favorite</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                this.props.handleAddDialog(true);
              }}
            >
              <Trans>Add to shelf</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                this.props.handleDeleteDialog(true);
              }}
            >
              <Trans>Delete</Trans>
            </span>
            <div className="select-more-actions-container">
              <span
                className="book-manage-title"
                onMouseEnter={(event) => {
                  this.setState({ isShowExport: true });
                }}
                onMouseLeave={(event) => {
                  this.setState({ isShowExport: false });
                  event.stopPropagation();
                }}
              >
                <Trans>More actions</Trans>
              </span>

              <div
                className="select-more-actions"
                style={this.state.isShowExport ? {} : { display: "none" }}
                onMouseLeave={() => {
                  this.setState({ isShowExport: false });
                }}
                onMouseEnter={(event) => {
                  this.setState({ isShowExport: true });
                  event?.stopPropagation();
                }}
              >
                <span
                  className="book-manage-title select-book-action"
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
                      toast.success(this.props.t("Export successful"));
                    } else {
                      toast(this.props.t("Nothing to export"));
                    }
                  }}
                >
                  <Trans>Export books</Trans>
                </span>
                <span
                  className="book-manage-title select-book-action"
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
                      toast.success(this.props.t("Export successful"));
                    } else {
                      toast(this.props.t("Nothing to export"));
                    }
                  }}
                >
                  <Trans>Export notes</Trans>
                </span>
                <span
                  className="book-manage-title select-book-action"
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
                      toast.success(this.props.t("Export successful"));
                    } else {
                      toast(this.props.t("Nothing to export"));
                    }
                  }}
                >
                  <Trans>Export highlights</Trans>
                </span>
                <span
                  className="book-manage-title select-book-action"
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
                      toast.success(this.props.t("Export successful"));
                    } else {
                      toast(this.props.t("Nothing to export"));
                    }
                  }}
                >
                  <Trans>Export dictionary history</Trans>
                </span>
                <span
                  className="book-manage-title select-book-action"
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
                      for (
                        let index = 0;
                        index < selectedBooks.length;
                        index++
                      ) {
                        const selectedBook = selectedBooks[index];
                        if (selectedBook.format === "PDF") {
                          toast(this.props.t("Not supported yet"));
                        } else {
                          toast(this.props.t("Pre-caching"));
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
                          toast.success(this.props.t("Pre-caching successful"));
                        } else {
                          toast.error(this.props.t("Pre-caching failed"));
                        }
                      }
                    } else {
                      toast(this.props.t("Nothing to precache"));
                    }
                  }}
                >
                  <Trans>Pre-cache</Trans>
                </span>
                <span
                  className="book-manage-title select-book-action"
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
                      toast.success(this.props.t("Deletion successful"));
                    }
                  }}
                >
                  <Trans>Delete pre-cache</Trans>
                </span>
              </div>
            </div>

            <span
              className="book-manage-title select-book-action"
              onClick={() => {
                if (
                  this.props.selectedBooks.length ===
                  this.handleFilterShelfBook(this.props.books).length
                ) {
                  this.props.handleSelectedBooks([]);
                } else {
                  this.props.handleSelectedBooks(
                    this.handleFilterShelfBook(this.props.books).map(
                      (item) => item.key
                    )
                  );
                }
              }}
            >
              {this.props.selectedBooks.length ===
              this.handleFilterShelfBook(this.props.books).length ? (
                <Trans>Deselect all</Trans>
              ) : (
                <Trans>Select all</Trans>
              )}
            </span>
          </>
        )}
      </div>
    );
  }
}

export default withRouter(SelectBook as any);
