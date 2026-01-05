import React from "react";
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
} from "../../utils/file/export";
import BookUtil from "../../utils/file/bookUtil";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";
import { preCacheAllBooks } from "../../utils/common";
class SelectBook extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {
      isOpenDelete: false,
      isShowExport: false,
      favoriteBooks: Object.keys(
        ConfigService.getAllListConfig("favoriteBooks")
      ).length,
    };
  }
  handleFilterShelfBook = (items: BookModel[]) => {
    if (this.props.shelfTitle) {
      let currentShelfTitle = this.props.shelfTitle;
      if (!currentShelfTitle) return items;
      let currentShelfList = ConfigService.getMapConfig(
        currentShelfTitle,
        "shelfList"
      );
      let shelfItems = items.filter((item: BookModel) => {
        return currentShelfList.indexOf(item.key) > -1;
      });
      return shelfItems;
    } else {
      if (ConfigService.getReaderConfig("isHideShelfBook") === "yes") {
        return items.filter((item) => {
          return (
            ConfigService.getFromAllMapConfig(item.key, "shelfList").length ===
            0
          );
        });
      }
      return items;
    }
  };
  handleShelf(items: any, index: number) {
    if (index < 1) return items;
    let shelfTitle = Object.keys(ConfigService.getAllMapConfig("shelfList"));
    let currentShelfTitle = shelfTitle[index];
    if (!currentShelfTitle) return items;
    let currentShelfList = ConfigService.getMapConfig(
      currentShelfTitle,
      "shelfList"
    );
    let shelfItems = items.filter((item: { key: number }) => {
      return currentShelfList.indexOf(item.key) > -1;
    });
    return shelfItems;
  }
  handleIndexFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };
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
                  this.props.selectedBooks.forEach((item) => {
                    ConfigService.setListConfig(item, "favoriteBooks");
                  });

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
                onMouseEnter={() => {
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
                    let books = await DatabaseService.getRecordsByBookKeys(
                      this.props.selectedBooks,
                      "books"
                    );
                    if (books.length > 0) {
                      await exportBooks(books);
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
                    let selectedBooks =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "books"
                      );
                    let notes = (
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "notes"
                      )
                    ).filter((note) => note.notes !== "");
                    if (notes.length > 0) {
                      exportNotes(notes, selectedBooks);
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
                    let selectedBooks =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "books"
                      );
                    let highlights = (
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "notes"
                      )
                    ).filter((note) => note.notes === "");
                    if (highlights.length > 0) {
                      exportHighlights(highlights, selectedBooks);
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
                    let selectedBooks =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "books"
                      );
                    let dictHistory =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "words"
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
                    let selectedBooks =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "books"
                      );
                    if (selectedBooks.length > 0) {
                      await preCacheAllBooks(selectedBooks);
                      toast.success(this.props.t("Pre-caching successful"));
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
                    let selectedBooks =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "books"
                      );
                    if (selectedBooks.length === 0) {
                      toast(this.props.t("Nothing to delete"));
                      return;
                    }
                    for (let index = 0; index < selectedBooks.length; index++) {
                      const selectedBook = selectedBooks[index];
                      await BookUtil.deleteBook(
                        "cache-" + selectedBook.key,
                        "zip"
                      );
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
                if (this.props.isSearch) {
                  this.props.handleSelectedBooks(
                    this.props.searchResults.map((item) => item.key)
                  );
                } else if (
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
