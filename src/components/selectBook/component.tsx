import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import BookModel from "../../models/Book";
import "./selectBook.css";
import { Trans } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
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
import { useAppStore } from "../../store/useAppStore";

const SelectBook = () => {
  const books = useAppStore((s) => s.manager.books);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const isCollapsed = useAppStore((s) => s.sidebar.isCollapsed);
  const isSearch = useAppStore((s) => s.manager.isSearch);
  const searchResults = useAppStore((s) => s.manager.searchResults) as any[];
  const shelfTitle = useAppStore((s) => s.sidebar.shelfTitle);
  const isSelectBook = useAppStore((s) => s.manager.isSelectBook);
  const handleDeleteDialog = useAppStore((s) => s.handleDeleteDialog);
  const handleSelectBook = useAppStore((s) => s.handleSelectBook);
  const handleAddDialog = useAppStore((s) => s.handleAddDialog);
  const handleSelectedBooks = useAppStore((s) => s.handleSelectedBooks);
  const handleAddCollectionDialog = useAppStore(
    (s) => s.handleAddCollectionDialog
  );
  const handleCollectionDialogBooks = useAppStore(
    (s) => s.handleCollectionDialogBooks
  );
  const { t } = useTranslation();
  const [state, setState] = useState<BookListState>({
    isShowExport: false,
    exportSubmenu: "",
  });

  const handleFilterShelfBook = (items: BookModel[]) => {
    if (shelfTitle) {
      let currentShelfTitle = shelfTitle;
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
      style={isCollapsed ? { left: "75px" } : {}}
    >
      {isSelectBook && (
        <>
          <span
            onClick={() => {
              handleSelectBook(!isSelectBook);
              if (isSelectBook) {
                handleSelectedBooks([]);
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
                books.filter(
                  (item: BookModel) =>
                    selectedBooks.indexOf(item.key) > -1
                ).length > 0
              ) {
                selectedBooks.forEach((item) => {
                  ConfigService.setListConfig(item, "favoriteBooks");
                });

                handleSelectBook(!isSelectBook);
                if (isSelectBook) {
                  handleSelectedBooks([]);
                }
                toast.success(t("Add successful"));
              } else {
                toast(t("Nothing to add"));
              }
            }}
          >
            <Trans>Add to favorite</Trans>
          </span>
          <span
            className="book-manage-title"
            onClick={() => {
              handleAddDialog(true);
            }}
          >
            <Trans>Add to shelf</Trans>
          </span>
          <span
            className="book-manage-title"
            onClick={() => {
              let bookKeys = filterNonCollectionKeys(selectedBooks);
              if (bookKeys.length === 0) {
                toast(t("Nothing to add"));
                return;
              }
              handleCollectionDialogBooks(bookKeys);
              handleAddCollectionDialog(true);
            }}
          >
            <Trans>Add to collection</Trans>
          </span>
          <span
            className="book-manage-title"
            onClick={() => {
              handleDeleteDialog(true);
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
                  let bookList = await DatabaseService.getRecordsByKeys(
                    selectedBooks,
                    "books"
                  );
                  if (bookList.length > 0) {
                    const result = await exportBookPackage(bookList);
                    if (result === "success") {
                      toast.success(t("Export successful"), {
                        id: "exporting",
                      });
                    } else if (result === "failed") {
                      toast.dismiss("exporting");
                      toast.error(t("Failed to export"), {
                        id: "exporting",
                      });
                    }
                  } else {
                    toast(t("Nothing to export"));
                  }
                }}
              >
                <Trans>Export book package</Trans>
              </span>
              <span
                className="book-manage-title select-book-action"
                onClick={async () => {
                  let bookList = await DatabaseService.getRecordsByKeys(
                    selectedBooks,
                    "books"
                  );
                  if (bookList.length > 0) {
                    const result = await exportBooks(bookList);
                    if (result === "success") {
                      toast.success(t("Export successful"), {
                        id: "exporting",
                      });
                    } else if (result === "failed") {
                      toast.dismiss("exporting");
                      toast.error(t("Failed to export"), {
                        id: "exporting",
                      });
                    }
                  } else {
                    toast(t("Nothing to export"));
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
                          let selectedBookList =
                            await DatabaseService.getRecordsByKeys(
                              selectedBooks,
                              "books"
                            );
                          let notes = (
                            await DatabaseService.getRecordsByBookKeys(
                              selectedBooks,
                              "notes"
                            )
                          ).filter(
                            (note) =>
                              note.notes !== "" && note.notes !== "annotation"
                          );
                          if (notes.length > 0) {
                            const result = await exportNotes(
                              notes,
                              selectedBookList,
                              fmt
                            );
                            if (result === "success") {
                              toast.success(t("Export successful"), {
                                id: "exporting",
                              });
                            } else if (result === "failed") {
                              toast.error(t("Failed to export"), {
                                id: "exporting",
                              });
                            }
                          } else {
                            toast(t("Nothing to export"));
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
                          let selectedBookList =
                            await DatabaseService.getRecordsByKeys(
                              selectedBooks,
                              "books"
                            );
                          let highlights = (
                            await DatabaseService.getRecordsByBookKeys(
                              selectedBooks,
                              "notes"
                            )
                          ).filter((note) => note.notes === "");
                          if (highlights.length > 0) {
                            const result = await exportHighlights(
                              highlights,
                              selectedBookList,
                              fmt
                            );
                            if (result === "success") {
                              toast.success(t("Export successful"), {
                                id: "exporting",
                              });
                            } else if (result === "failed") {
                              toast.error(t("Failed to export"), {
                                id: "exporting",
                              });
                            }
                          } else {
                            toast(t("Nothing to export"));
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
                        let selectedBookList =
                          await DatabaseService.getRecordsByKeys(
                            selectedBooks,
                            "books"
                          );
                        let dictHistory =
                          await DatabaseService.getRecordsByBookKeys(
                            selectedBooks,
                            "words"
                          );
                        if (dictHistory.length > 0) {
                          const result = await exportDictionaryHistory(
                            dictHistory,
                            selectedBookList,
                            fmt
                          );
                          if (result === "success") {
                            toast.success(t("Export successful"), {
                              id: "exporting",
                            });
                          } else if (result === "failed") {
                            toast.error(t("Failed to export"), {
                              id: "exporting",
                            });
                          }
                        } else {
                          toast(t("Nothing to export"));
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
                  let selectedBookList = await DatabaseService.getRecordsByKeys(
                    selectedBooks,
                    "books"
                  );
                  if (selectedBookList.length > 0) {
                    await preCacheAllBooks(selectedBookList);
                    toast.success(t("Pre-caching successful"));
                  } else {
                    toast(t("Nothing to precache"));
                  }
                }}
              >
                <Trans>Pre-cache</Trans>
              </span>
              <span
                className="book-manage-title select-book-action"
                onClick={async () => {
                  let selectedBookList = await DatabaseService.getRecordsByKeys(
                    selectedBooks,
                    "books"
                  );
                  if (selectedBookList.length === 0) {
                    toast(t("Nothing to delete"));
                    return;
                  }
                  for (
                    let index = 0;
                    index < selectedBookList.length;
                    index++
                  ) {
                    const selectedBook = selectedBookList[index];
                    await BookUtil.deleteBook("cache-" + selectedBook.key, "zip");
                    toast.success(t("Deletion successful"));
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
              if (isSearch) {
                handleSelectedBooks(
                  searchResults.map((item) => item.key)
                );
              } else if (
                selectedBooks.length ===
                handleFilterShelfBook(books).length
              ) {
                handleSelectedBooks([]);
              } else {
                handleSelectedBooks(
                  handleFilterShelfBook(books).map((item) => item.key)
                );
              }
            }}
          >
            {selectedBooks.length ===
            handleFilterShelfBook(books).length ? (
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

export default SelectBook;
