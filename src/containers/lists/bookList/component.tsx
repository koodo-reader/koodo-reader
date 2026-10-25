import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
﻿import React, { useEffect, useRef, useState } from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookListItem from "../../../components/bookListItem";
import BookCoverItem from "../../../components/bookCoverItem";
import CollectionItem from "../../../components/collectionItem";
import BookModel from "../../../models/Book";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { Navigate } from "react-router-dom";
import ViewMode from "../../../components/viewMode";
import SelectBook from "../../../components/selectBook";
import { Trans } from "react-i18next";
import Book from "../../../models/Book";
import { isElectron } from "react-device-detect";
import DatabaseService from "../../../utils/storage/databaseService";
import { throttle } from "../../../utils/common";
import { useAppStore } from "../../../store/useAppStore";

export interface BookListState {
  favoriteBooks: number;
  isHideShelfBook: boolean;
  displayedBooksCount: number;
  isLoadingMore: boolean;
  fullBooksData: BookModel[];
  cardScale: number;
  readingStatusFilter: string;
}

const collectionUtil = new CollectionUtil(ConfigService);
declare var window: any;
let currentBookMode = "home";
function getBookCountPerPage() {
  const container = document.querySelector(
    ".book-list-container"
  ) as HTMLElement;
  if (!container) return 24; // fallback
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const bookWidth = 133;
  const bookHeight = 201;
  const columns = Math.max(1, Math.floor(containerWidth / bookWidth));
  const rows = Math.max(1, Math.floor(containerHeight / bookHeight)) + 2;
  return columns * rows;
}

const BookList = () => {
  const books = useAppStore((s) => s.manager.books);
  const mode = useAppStore((s) => s.sidebar.mode);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const shelfTitle = useAppStore((s) => s.sidebar.shelfTitle);
  const isCollapsed = useAppStore((s) => s.sidebar.isCollapsed);
  const searchResults = useAppStore((s) => s.manager.searchResults);
  const isSearch = useAppStore((s) => s.manager.isSearch);
  const isSelectBook = useAppStore((s) => s.manager.isSelectBook);
  const viewMode = useAppStore((s) => s.manager.viewMode);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleLoadMore = useAppStore((s) => s.handleLoadMore);
  const { t } = useTranslation();
  const scrollContainer = useRef<HTMLUListElement | null>(null);
  const [state, setState] = useState<BookListState>(() => ({
    favoriteBooks: Object.keys(ConfigService.getAllListConfig("favoriteBooks"))
      .length,
    isHideShelfBook: ConfigService.getReaderConfig("isHideShelfBook") === "yes",
    displayedBooksCount: 24,
    isLoadingMore: false,
    fullBooksData: [],
    // Migrated comment
    cardScale: parseFloat(ConfigService.getReaderConfig("cardScale") || "1"),
    readingStatusFilter: "",
  }));

  // Migrated comment
  // Migrated comment
  const stateRef = useLatest(state);

  const handleKeyFilter = (items: any[], arr: string[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items.forEach((subItem: any) => {
        if (subItem.key === item) {
          itemArr.push(subItem);
        }
      });
    });
    return itemArr;
  };

  const handleShelf = (items: any, shelfTitle: string) => {
    if (!shelfTitle) return items;
    let currentShelfTitle = shelfTitle;
    let currentShelfList = ConfigService.getMapConfig(
      currentShelfTitle,
      "shelfList"
    );
    let shelfItems = items.filter((item: { key: number }) => {
      return currentShelfList.indexOf(item.key) > -1;
    });
    return shelfItems;
  };

  //get the searched books according to the index
  const handleIndexFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };

  const isCollectionInShelf = (
    collectionKey: string,
    memberKeys: string[]
  ): boolean => {
    if (
      ConfigService.getFromAllMapConfig(collectionKey, "shelfList").length > 0
    ) {
      return true;
    }
    return memberKeys.some((bookKey) => {
      return (
        ConfigService.getFromAllMapConfig(bookKey, "shelfList").length > 0
      );
    });
  };

  const handleFilterShelfBook = (items: BookModel[]) => {
    return items.filter((item) => {
      if (collectionUtil.isCollection(item.key)) {
        let collection = collectionUtil.getCollection(item.key);
        if (!collection) return false;
        return !isCollectionInShelf(collection.key, collection.books);
      }
      return (
        ConfigService.getFromAllMapConfig(item.key, "shelfList").length === 0
      );
    });
  };

  const resolveCollectionItems = (items: any[]): any[] => {
    if (!items) return [];
    let result: any[] = [];
    let seen = new Set<string>();
    items.forEach((item) => {
      let key = item.key;
      if (!key) return;
      if (collectionUtil.isCollection(key)) {
        if (collectionUtil.isCollectionDeleted(key)) return;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(item);
        }
        return;
      }
      let collection = collectionUtil.getActiveCollectionByBook(key);
      if (collection) {
        if (!seen.has(collection.key)) {
          seen.add(collection.key);
          result.push({ ...item, key: collection.key });
        }
        return;
      }
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    });
    return result;
  };

  const filterBooksByReadingStatus = (
    books: Book[],
    status: string
  ): Book[] => {
    if (!status) return books;
    return books.filter((book) => {
      if (collectionUtil.isCollection(book.key)) {
        let collection = collectionUtil.getCollection(book.key);
        if (!collection) return false;
        return collectionUtil.getCollectionReadingStatus(collection) === status;
      }
      const record = ConfigService.getObjectConfig(
        book.key,
        "recordLocation",
        {}
      );
      const percentage: string =
        record && record.percentage ? record.percentage : "";
      if (status === "unread") {
        return !percentage || percentage === "0";
      } else if (status === "reading") {
        return percentage && percentage !== "0" && percentage !== "1";
      } else if (status === "finished") {
        return percentage === "1";
      }
      return true;
    });
  };

  const handleBooks = () => {
    let bookMode = isSearch
      ? "search"
      : shelfTitle
        ? "shelf"
        : mode === "favorite"
          ? "favorite"
          : stateRef.current.isHideShelfBook
            ? "hide"
            : "home";
    let filteredBooks =
      bookMode === "search"
        ? searchResults
        : bookMode === "shelf"
          ? handleShelf(books, shelfTitle)
          : bookMode === "favorite"
            ? handleKeyFilter(
                books,
                ConfigService.getAllListConfig("favoriteBooks")
              )
            : books;
    filteredBooks = resolveCollectionItems(filteredBooks);
    if (bookMode === "hide") {
      filteredBooks = handleFilterShelfBook(filteredBooks);
    }
    if (stateRef.current.readingStatusFilter) {
      filteredBooks = filterBooksByReadingStatus(
        filteredBooks,
        stateRef.current.readingStatusFilter
      );
    }
    const topBookKeys: string[] = ConfigService.getAllListConfig("topBooks");
    if (topBookKeys.length > 0) {
      const topSet = new Set(topBookKeys);
      const topBooks = [...topBookKeys]
        .map((key) => filteredBooks.find((b) => b.key === key))
        .filter(Boolean) as Book[];
      const restBooks = filteredBooks.filter((b) => !topSet.has(b.key));
      filteredBooks = [...topBooks, ...restBooks];
    }
    return {
      books: filteredBooks,
      bookMode,
    };
  };

  // Migrated comment
  const loadFullBooksData = async (
    displayedBooksCount = stateRef.current.displayedBooksCount
  ) => {
    const { books } = handleBooks();
    const displayedBooks = books.slice(0, displayedBooksCount);

    const fullBooksData: Book[] = [];
    for (let i = 0; i < displayedBooks.length; i++) {
      const key = displayedBooks[i].key;
      if (collectionUtil.isCollection(key)) {
        const collection = collectionUtil.getCollection(key);
        if (collection) {
          fullBooksData.push(collectionUtil.getCollectionAsBook(collection));
        }
        continue;
      }
      const book = await DatabaseService.getRecord(key, "books");
      if (book) {
        fullBooksData.push(book);
      }
    }

    setState((prevState) => ({ ...prevState, fullBooksData }));
  };

  const handleFinishReading = async () => {
    if (!scrollContainer.current) return;
    if (
      scrollContainer.current &&
      scrollContainer.current.scrollTop > 100
    ) {
      //ignore if the scroll is not at top
    } else {
      handleFetchBooks();
    }
  };

  const loadMoreBooks = () => {
    const { books } = handleBooks();
    const { displayedBooksCount } = stateRef.current;

    if (displayedBooksCount >= books.length) {
      return;
      // Migrated comment
    }

    setState((prevState) => ({ ...prevState, isLoadingMore: true }));
    handleLoadMore(true);
    // Migrated comment
    setTimeout(async () => {
      const newDisplayedBooksCount = Math.min(
        displayedBooksCount + getBookCountPerPage(),
        books.length
      );

      // Migrated comment
      const newBooks = books.slice(displayedBooksCount, newDisplayedBooksCount);
      const newFullBooksData: Book[] = [];
      for (let i = 0; i < newBooks.length; i++) {
        const key = newBooks[i].key;
        if (collectionUtil.isCollection(key)) {
          const collection = collectionUtil.getCollection(key);
          if (collection) {
            newFullBooksData.push(
              collectionUtil.getCollectionAsBook(collection)
            );
          }
          continue;
        }
        const book = await DatabaseService.getRecord(key, "books");
        if (book) {
          newFullBooksData.push(book);
        }
      }

      setState((prevState) => ({
        ...prevState,
        displayedBooksCount: newDisplayedBooksCount,
        isLoadingMore: false,
        fullBooksData: [...stateRef.current.fullBooksData, ...newFullBooksData],
      }));
    }, 100);
  };

  const handleScroll = () => {
    const scrollContainerCurrent = scrollContainer.current;
    if (!scrollContainerCurrent || stateRef.current.isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerCurrent;
    // Migrated comment
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      loadMoreBooks();
    }
  };

  // Migrated comment
  const handleFinishReadingRef = useLatest(handleFinishReading);
  const handleScrollRef = useLatest(handleScroll);

  // Migrated comment
  useEffect(() => {
    handleFetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Migrated comment
  useEffect(() => {
    const displayedBooksCount = getBookCountPerPage();
    setState((prevState) => ({
      ...prevState,
      displayedBooksCount,
    }));

    // Migrated comment
    const resizeHandler = throttle(() => {
      //recount the book count per page when the window is resized
      handleFetchBooks();
    });
    window.addEventListener("resize", resizeHandler);

    // Migrated comment
    const scrollContainerCurrent = scrollContainer.current;
    const scrollHandler = () => {
      handleScrollRef.current();
    };
    if (scrollContainerCurrent) {
      scrollContainerCurrent.addEventListener("scroll", scrollHandler);
    }

    // Migrated comment
    const visibilityChangeHandler = async () => {
      if (document.visibilityState === "visible" && !isElectron) {
        await handleFinishReadingRef.current();
      }
    };
    document.addEventListener("visibilitychange", visibilityChangeHandler);

    const ipcRenderer = isElectron ? window.electronAPI : null;
    let readingFinishedHandler: ((config: any) => void) | null = null;
    if (isElectron) {
      readingFinishedHandler = async () => {
        handleFinishReadingRef.current();
      };
      ipcRenderer.on("reading-finished", readingFinishedHandler);
    }

    // Migrated comment
    loadFullBooksData(displayedBooksCount);

    return () => {
      // Migrated comment
      if (scrollContainerCurrent) {
        scrollContainerCurrent.removeEventListener("scroll", scrollHandler);
      }

      // Migrated comment
      window.removeEventListener("resize", resizeHandler);

      // Migrated comment
      document.removeEventListener("visibilitychange", visibilityChangeHandler);

      // Migrated comment
      if (isElectron && readingFinishedHandler) {
        ipcRenderer.removeListener("reading-finished", readingFinishedHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Migrated comment
  const prevPropsRef = useRef({
    books,
    searchResults,
    isSearch,
    mode,
    shelfTitle,
  });
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    prevPropsRef.current = {
      books,
      searchResults,
      isSearch,
      mode,
      shelfTitle,
    };
    if (
      prevProps.books !== books ||
      prevProps.searchResults !== searchResults ||
      prevProps.isSearch !== isSearch ||
      prevProps.mode !== mode ||
      prevProps.shelfTitle !== shelfTitle
    ) {
      const nextDisplayedBooksCount = getBookCountPerPage();
      setState((prevState) => ({
        ...prevState,
        displayedBooksCount: nextDisplayedBooksCount,
        isLoadingMore: false,
      }));
      handleLoadMore(false);
      // Migrated comment
      if (scrollContainer.current) {
        scrollContainer.current.scrollTop = 0;
      }
      // Migrated comment
      loadFullBooksData(nextDisplayedBooksCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, searchResults, isSearch, mode, shelfTitle]);

  // Migrated comment
  const prevReadingStatusFilterRef = useRef(state.readingStatusFilter);
  useEffect(() => {
    const prevReadingStatusFilter = prevReadingStatusFilterRef.current;
    prevReadingStatusFilterRef.current = state.readingStatusFilter;
    if (prevReadingStatusFilter !== state.readingStatusFilter) {
      loadFullBooksData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.readingStatusFilter]);

  const handleCardScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    setState((prevState) => ({ ...prevState, cardScale: scale }));
    ConfigService.setReaderConfig("cardScale", String(scale));
  };

  const renderBookList = (books: Book[], bookMode: string) => {
    if (books.length === 0 && !isSearch) {
      return <Navigate to="/manager/empty" replace />;
    }
    if (bookMode !== currentBookMode) {
      currentBookMode = bookMode;
    }

    // Migrated comment
// Migrated comment
    const filteredKeys = new Set(books.map((b) => b.key));
    const displayedBooks = isSearch
      ? books
      : state.fullBooksData.filter((b) => filteredKeys.has(b.key));

    return displayedBooks.map((item: BookModel, index: number) => {
      if (collectionUtil.isCollection(item.key)) {
        const collection = collectionUtil.getCollection(item.key);
        if (!collection) return null;
        const collectionProps = {
          collection,
          isSelected: selectedBooks.indexOf(item.key) > -1,
          allBooks: displayedBooks,
          bookIndex: index,
        };
        return viewMode === "list" ? (
          <CollectionItem
            key={item.key}
            {...({ ...collectionProps, viewMode: "list" } as any)}
          />
        ) : viewMode === "card" ? (
          <CollectionItem
            key={item.key}
            {...({
              ...collectionProps,
              viewMode: "card",
              cardScale: state.cardScale,
            } as any)}
          />
        ) : (
          <CollectionItem
            key={item.key}
            {...({ ...collectionProps, viewMode: "cover" } as any)}
          />
        );
      }
      if (!item.format || item.format === "COLLECTION") {
        return null;
      }
      return viewMode === "list" ? (
        <BookListItem
          key={index}
          {...({
            book: item,
            isSelected: selectedBooks.indexOf(item.key) > -1,
            allBooks: displayedBooks,
            bookIndex: index,
          } as any)}
        />
      ) : viewMode === "card" ? (
        <BookCardItem
          key={index}
          {...({
            book: item,
            cardScale: state.cardScale,
            isSelected: selectedBooks.indexOf(item.key) > -1,
            allBooks: displayedBooks,
            bookIndex: index,
          } as any)}
        />
      ) : (
        <BookCoverItem
          key={index}
          {...({
            book: item,
            isSelected: selectedBooks.indexOf(item.key) > -1,
            allBooks: displayedBooks,
            bookIndex: index,
          } as any)}
        />
      );
    });
  };

  if (
    (state.favoriteBooks === 0 && mode === "favorite") ||
    !books ||
    !books[0]
  ) {
    return <Navigate to="/manager/empty" replace />;
  }
  const { books: displayedBookList, bookMode } = handleBooks();
  return (
    <>
      <div
        className="book-list-header"
        style={
          isCollapsed ? { width: "calc(100% - 70px)", left: "70px" } : {}
        }
      >
        <SelectBook />

        <div
          style={isSelectBook ? { display: "none" } : {}}
          className="book-list-header-right"
        >
          {viewMode === "card" && (
            <input
              type="range"
              min="0.6"
              max="2"
              step="0.05"
              value={state.cardScale}
              onChange={handleCardScaleChange}
              className="book-card-scale-slider"
              title="Adjust cover size"
            />
          )}
          <div className="book-list-total-page">
            <Trans i18nKey="Total books" count={displayedBookList.length}>
              {"Total " + displayedBookList.length + " books"}
            </Trans>
          </div>
          <select
            className="lang-setting-dropdown"
            value={state.readingStatusFilter}
            onChange={(e) => {
              const value = e.target.value;
              setState((prevState) => ({
                ...prevState,
                readingStatusFilter: value,
              }));
            }}
            style={{
              marginRight: "10px",
              width: "70px",
              borderWidth: "0px",
              backgroundColor: "transparent",
            }}
          >
            <option value="" className="lang-setting-option">
              {t("All")}
            </option>
            <option value="unread" className="lang-setting-option">
              {t("Unread")}
            </option>
            <option value="reading" className="lang-setting-option">
              {t("CurrentlyReading")}
            </option>
            <option value="finished" className="lang-setting-option">
              {t("Finished")}
            </option>
          </select>
          <ViewMode />
        </div>
      </div>
      <div
        className="book-list-container-parent"
        style={
          isCollapsed ? { width: "calc(100vw - 70px)", left: "70px" } : {}
        }
      >
        <div className="book-list-container">
          <ul
            className="book-list-item-box"
            ref={scrollContainer}
            style={
              { "--card-scale": state.cardScale } as React.CSSProperties
            }
          >
            {renderBookList(displayedBookList, bookMode)}
          </ul>
        </div>
      </div>
    </>
  );
};

export default BookList;

