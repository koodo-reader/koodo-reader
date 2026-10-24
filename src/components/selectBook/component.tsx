import React, { useState } from "react";
import BookModel from "../../models/Book";
import "./selectBook.css";
import { Trans } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
import { withRouter } from "react-router-dom";
import toast from "react-hot-toast";
import {
  exportBookPackage,
  exportBooks,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../utils/file/export";
import BookUtil from "../../utils/file/bookUtil";
import { filterNonCollectionKeys } from "../../utils/reader/bookDrag";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";
import { preCacheAllBooks } from "../../utils/common";

const SelectBook = (props: BookListProps) => {
  const [state, setState] = useState<BookListState>({
    isShowExport: false,
    exportSubmenu: "",
  });

  const handleFilterShelfBook = (items: BookModel[]) => {
    if (props.shelfTitle) {
      let currentShelfTitle = props.shelfTitle;
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

  const handleShelf = (items: any, index: number) => {
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
  };

  const handleIndexFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };

  return (
    <div
      className="booklist-manage-container"
      style={props.isCollapsed ? { left: "75px" } : {}}
    >
      {props.isSelectBook && (
        <>
          <span
            onClick={() => {
              props.handleSelectBook(!props.isSelectBook);
              if (props.isSelectBook) {
                props.handleSelectedBooks([]);
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
                props.books.filter(
                  (item: BookModel) =>
                    props.selectedBooks.indexOf(item.key) > -1
                ).length > 0
              ) {
                props.selectedBooks.forEach((item) => {
                  ConfigService.setListConfig(item, "favoriteBooks");
                });

                props.handleSelectBook(!props.isSelectBook);
                if (props.isSelectBook) {
                  props.handleSelectedBooks([]);
                }
                toast.success(props.t("Add successful"));
              } else {
                toast(props.t("Nothing to add"));
              }
            }}
          >
            <Trans>Add to favorite</Trans>
          </span>
          <span
            className="book-manage-title"
            onClick={() => {
              props.handleAddDialog(true);
            }}
          >
            <Trans>Add to shelf</Trans>
          </span>
          <span
            className="book-manage-title"
            onClick={() => {
              let bookKeys = filterNonCollectionKeys(props.selectedBooks);
              if (bookKeys.length === 0) {
                toast(props.t("Nothing to add"));
                return;
              }
              props.handleCollectionDialogBooks(bookKeys);
              props.handleAddCollectionDialog(true);
            }}
          >
            <Trans>Add to collection</Trans>
          </span>
          <span
            className="book-manage-title"
            onClick={() => {
              props.handleDeleteDialog(true);
            }}
          >
            <Trans>Delete</Trans>
          </span>
          <div className="select-more-actions-container">
            <span
              className="book-manage-title"
              onMouseEnter={() => {
                setState((prev) => ({ ...prev, isShowExport: true }));
              }}
              onMouseLeave={(event) => {
                setState((prev) => ({ ...prev, isShowExport: false }));
                event.stopPropagation();
              }}
            >
              <Trans>More actions</Trans>
            </span>

            <div
              className="select-more-actions"
              style={state.isShowExport ? {} : { display: "none" }}
              onMouseLeave={() => {
                setState((prev) => ({ ...prev, isShowExport: false }));
              }}
              onMouseEnter={(event) => {
                setState((prev) => ({ ...prev, isShowExport: true }));
                event?.stopPropagation();
              }}
            >
              <span
                className="book-manage-title select-book-action"
                onClick={async () => {
                  let books = await DatabaseService.getRecordsByKeys(
                    props.selectedBooks,
                    "books"
                  );
                  if (books.length > 0) {
                    const result = await exportBookPackage(books);
                    if (result === "success") {
                      toast.success(props.t("Export successful"), {
                        id: "exporting",
                      });
                    } else if (result === "failed") {
                      toast.dismiss("exporting");
                      toast.error(props.t("Failed to export"), {
                        id: "exporting",
                      });
                    }
                  } else {
                    toast(props.t("Nothing to export"));
                  }
                }}
              >
                <Trans>Export book package</Trans>
              </span>
              <span
                className="book-manage-title select-book-action"
                onClick={async () => {
                  let books = await DatabaseService.getRecordsByKeys(
                    props.selectedBooks,
                    "books"
                  );
                  if (books.length > 0) {
                    const result = await exportBooks(books);
                    if (result === "success") {
                      toast.success(props.t("Export successful"), {
                        id: "exporting",
                      });
                    } else if (result === "failed") {
                      toast.dismiss("exporting");
                      toast.error(props.t("Failed to export"), {
                        id: "exporting",
                      });
                    }
                  } else {
                    toast(props.t("Nothing to export"));
                  }
                }}
              >
                <Trans>Export books</Trans>
              </span>
              <div style={{ position: "relative" }}>
                <span
                  className="book-manage-title select-book-action"
                  onMouseEnter={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "notes",
                      isShowExport: true,
                    }));
                  }}
                  onMouseLeave={() => {
                    setState((prev) => ({ ...prev, exportSubmenu: "" }));
                  }}
                >
                  <Trans>Export notes</Trans>
                  <span className="icon-dropdown icon-export-all"></span>
                </span>
                <div
                  className="select-more-actions select-export-format-submenu"
                  style={
                    state.exportSubmenu === "notes"
                      ? { left: "160px", top: "auto", bottom: "0px" }
                      : { display: "none" }
                  }
                  onMouseEnter={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "notes",
                      isShowExport: true,
                    }));
                  }}
                  onMouseLeave={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "",
                      isShowExport: false,
                    }));
                  }}
                >
                  {(["csv", "md", "txt", "html", "pdf", "json"] as const).map(
                    (fmt) => (
                      <span
                        key={fmt}
                        className="book-manage-title select-book-action"
                        onClick={async () => {
                          let selectedBooks =
                            await DatabaseService.getRecordsByKeys(
                              props.selectedBooks,
                              "books"
                            );
                          let notes = (
                            await DatabaseService.getRecordsByBookKeys(
                              props.selectedBooks,
                              "notes"
                            )
                          ).filter(
                            (note) =>
                              note.notes !== "" && note.notes !== "annotation"
                          );
                          if (notes.length > 0) {
                            const result = await exportNotes(
                              notes,
                              selectedBooks,
                              fmt
                            );
                            if (result === "success") {
                              toast.success(props.t("Export successful"), {
                                id: "exporting",
                              });
                            } else if (result === "failed") {
                              toast.error(props.t("Failed to export"), {
                                id: "exporting",
                              });
                            }
                          } else {
                            toast(props.t("Nothing to export"));
                          }
                          setState((prev) => ({
                            ...prev,
                            exportSubmenu: "",
                            isShowExport: false,
                          }));
                        }}
                      >
                        {
                          ({
                            csv: "CSV",
                            md: "Markdown",
                            txt: "TXT",
                            html: "HTML",
                            pdf: "PDF",
                            json: "JSON",
                          } as Record<string, string>)[fmt]
                        }
                      </span>
                    )
                  )}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  className="book-manage-title select-book-action"
                  onMouseEnter={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "highlights",
                      isShowExport: true,
                    }));
                  }}
                  onMouseLeave={() => {
                    setState((prev) => ({ ...prev, exportSubmenu: "" }));
                  }}
                >
                  <Trans>Export highlights</Trans>
                  <span className="icon-dropdown icon-export-all"></span>
                </span>
                <div
                  className="select-more-actions select-export-format-submenu"
                  style={
                    state.exportSubmenu === "highlights"
                      ? { left: "160px", top: "auto", bottom: "0px" }
                      : { display: "none" }
                  }
                  onMouseEnter={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "highlights",
                      isShowExport: true,
                    }));
                  }}
                  onMouseLeave={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "",
                      isShowExport: false,
                    }));
                  }}
                >
                  {(["csv", "md", "txt", "html", "pdf", "json"] as const).map(
                    (fmt) => (
                      <span
                        key={fmt}
                        className="book-manage-title select-book-action"
                        onClick={async () => {
                          let selectedBooks =
                            await DatabaseService.getRecordsByKeys(
                              props.selectedBooks,
                              "books"
                            );
                          let highlights = (
                            await DatabaseService.getRecordsByBookKeys(
                              props.selectedBooks,
                              "notes"
                            )
                          ).filter((note) => note.notes === "");
                          if (highlights.length > 0) {
                            const result = await exportHighlights(
                              highlights,
                              selectedBooks,
                              fmt
                            );
                            if (result === "success") {
                              toast.success(props.t("Export successful"), {
                                id: "exporting",
                              });
                            } else if (result === "failed") {
                              toast.error(props.t("Failed to export"), {
                                id: "exporting",
                              });
                            }
                          } else {
                            toast(props.t("Nothing to export"));
                          }
                          setState((prev) => ({
                            ...prev,
                            exportSubmenu: "",
                            isShowExport: false,
                          }));
                        }}
                      >
                        {
                          ({
                            csv: "CSV",
                            md: "Markdown",
                            txt: "TXT",
                            html: "HTML",
                            pdf: "PDF",
                            json: "JSON",
                          } as Record<string, string>)[fmt]
                        }
                      </span>
                    )
                  )}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  className="book-manage-title select-book-action"
                  onMouseEnter={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "words",
                      isShowExport: true,
                    }));
                  }}
                  onMouseLeave={() => {
                    setState((prev) => ({ ...prev, exportSubmenu: "" }));
                  }}
                >
                  <Trans>Export dictionary history</Trans>
                  <span className="icon-dropdown icon-export-all"></span>
                </span>
                <div
                  className="select-more-actions select-export-format-submenu"
                  style={
                    state.exportSubmenu === "words"
                      ? { left: "160px", top: "auto", bottom: "0px" }
                      : { display: "none" }
                  }
                  onMouseEnter={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "words",
                      isShowExport: true,
                    }));
                  }}
                  onMouseLeave={() => {
                    setState((prev) => ({
                      ...prev,
                      exportSubmenu: "",
                      isShowExport: false,
                    }));
                  }}
                >
                  {(["csv", "json"] as const).map((fmt) => (
                    <span
                      key={fmt}
                      className="book-manage-title select-book-action"
                      onClick={async () => {
                        let selectedBooks =
                          await DatabaseService.getRecordsByKeys(
                            props.selectedBooks,
                            "books"
                          );
                        let dictHistory =
                          await DatabaseService.getRecordsByBookKeys(
                            props.selectedBooks,
                            "words"
                          );
                        if (dictHistory.length > 0) {
                          const result = await exportDictionaryHistory(
                            dictHistory,
                            selectedBooks,
                            fmt
                          );
                          if (result === "success") {
                            toast.success(props.t("Export successful"), {
                              id: "exporting",
                            });
                          } else if (result === "failed") {
                            toast.error(props.t("Failed to export"), {
                              id: "exporting",
                            });
                          }
                        } else {
                          toast(props.t("Nothing to export"));
                        }
                        setState((prev) => ({
                          ...prev,
                          exportSubmenu: "",
                          isShowExport: false,
                        }));
                      }}
                    >
                      {fmt === "csv" ? "CSV" : "JSON"}
                    </span>
                  ))}
                </div>
              </div>
              <span
                className="book-manage-title select-book-action"
                onClick={async () => {
                  let selectedBooks = await DatabaseService.getRecordsByKeys(
                    props.selectedBooks,
                    "books"
                  );
                  if (selectedBooks.length > 0) {
                    await preCacheAllBooks(selectedBooks);
                    toast.success(props.t("Pre-caching successful"));
                  } else {
                    toast(props.t("Nothing to precache"));
                  }
                }}
              >
                <Trans>Pre-cache</Trans>
              </span>
              <span
                className="book-manage-title select-book-action"
                onClick={async () => {
                  let selectedBooks = await DatabaseService.getRecordsByKeys(
                    props.selectedBooks,
                    "books"
                  );
                  if (selectedBooks.length === 0) {
                    toast(props.t("Nothing to delete"));
                    return;
                  }
                  for (let index = 0; index < selectedBooks.length; index++) {
                    const selectedBook = selectedBooks[index];
                    await BookUtil.deleteBook("cache-" + selectedBook.key, "zip");
                    toast.success(props.t("Deletion successful"));
                  }
                }}
              >
                <Trans>Delete pre-cache</Trans>
              </span>
            </div>
          </div>

          <span
            className="book-manage-title"
            onClick={() => {
              if (props.isSearch) {
                props.handleSelectedBooks(
                  props.searchResults.map((item) => item.key)
                );
              } else if (
                props.selectedBooks.length ===
                handleFilterShelfBook(props.books).length
              ) {
                props.handleSelectedBooks([]);
              } else {
                props.handleSelectedBooks(
                  handleFilterShelfBook(props.books).map((item) => item.key)
                );
              }
            }}
          >
            {props.selectedBooks.length ===
            handleFilterShelfBook(props.books).length ? (
              <Trans>Deselect all</Trans>
            ) : (
              <Trans>Select all</Trans>
            )}
          </span>
        </>
      )}
    </div>
  );
};

export default withRouter(SelectBook as any);
