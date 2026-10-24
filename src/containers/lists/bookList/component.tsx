import React, { useEffect, useRef, useState } from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookListItem from "../../../components/bookListItem";
import BookCoverItem from "../../../components/bookCoverItem";
import CollectionItem from "../../../components/collectionItem";
import BookModel from "../../../models/Book";
import { BookListProps, BookListState } from "./interface";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { Redirect, withRouter } from "react-router-dom";
import ViewMode from "../../../components/viewMode";
import SelectBook from "../../../components/selectBook";
import { Trans } from "react-i18next";
import Book from "../../../models/Book";
import { isElectron } from "react-device-detect";
import DatabaseService from "../../../utils/storage/databaseService";
import { throttle } from "../../../utils/common";

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

const BookList = (props: BookListProps) => {
  const scrollContainer = useRef<HTMLUListElement | null>(null);
  const [state, setState] = useState<BookListState>(() => ({
    favoriteBooks: Object.keys(ConfigService.getAllListConfig("favoriteBooks"))
      .length,
    isHideShelfBook: ConfigService.getReaderConfig("isHideShelfBook") === "yes",
    displayedBooksCount: 24,
    isLoadingMore: false,
    fullBooksData: [], // 存储从数据库加载的完整书籍数据
    cardScale: parseFloat(ConfigService.getReaderConfig("cardScale") || "1"),
    readingStatusFilter: "",
  }));

  // 与 class 组件的 this.state 语义保持一致：在异步回调中读取最新已提交状态
  const stateRef = useRef(state);
  stateRef.current = state;

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
    let bookMode = props.isSearch
      ? "search"
      : props.shelfTitle
        ? "shelf"
        : props.mode === "favorite"
          ? "favorite"
          : stateRef.current.isHideShelfBook
            ? "hide"
            : "home";
    let books =
      bookMode === "search"
        ? props.searchResults
        : bookMode === "shelf"
          ? handleShelf(props.books, props.shelfTitle)
          : bookMode === "favorite"
            ? handleKeyFilter(
                props.books,
                ConfigService.getAllListConfig("favoriteBooks")
              )
            : props.books;
    books = resolveCollectionItems(books);
    if (bookMode === "hide") {
      books = handleFilterShelfBook(books);
    }
    if (stateRef.current.readingStatusFilter) {
      books = filterBooksByReadingStatus(
        books,
        stateRef.current.readingStatusFilter
      );
    }
    const topBookKeys: string[] = ConfigService.getAllListConfig("topBooks");
    if (topBookKeys.length > 0) {
      const topSet = new Set(topBookKeys);
      const topBooks = [...topBookKeys]
        .map((key) => books.find((b) => b.key === key))
        .filter(Boolean) as Book[];
      const restBooks = books.filter((b) => !topSet.has(b.key));
      books = [...topBooks, ...restBooks];
    }
    return {
      books,
      bookMode,
    };
  };

  // 从数据库加载完整的书籍数据
  const loadFullBooksData = async () => {
    const { books } = handleBooks();
    const displayedBooks = books.slice(0, stateRef.current.displayedBooksCount);

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
      props.handleFetchBooks();
    }
  };

  const loadMoreBooks = () => {
    const { books } = handleBooks();
    const { displayedBooksCount } = stateRef.current;

    if (displayedBooksCount >= books.length) {
      return; // 已经显示所有图书
    }

    setState((prevState) => ({ ...prevState, isLoadingMore: true }));
    props.handleLoadMore(true);
    // 异步加载更多书籍数据
    setTimeout(async () => {
      const newDisplayedBooksCount = Math.min(
        displayedBooksCount + getBookCountPerPage(),
        books.length
      );

      // 加载新增的书籍数据
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
    // 当滚动到底部附近时触发加载更多
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      loadMoreBooks();
    }
  };

  // 保持事件监听器始终调用最新一次渲染的处理函数
  const handleFinishReadingRef = useRef(handleFinishReading);
  handleFinishReadingRef.current = handleFinishReading;
  const handleScrollRef = useRef(handleScroll);
  handleScrollRef.current = handleScroll;

  // UNSAFE_componentWillMount: 拉取书籍列表
  useEffect(() => {
    props.handleFetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidMount: 计算每页数量、注册监听器并加载书籍数据
  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      displayedBooksCount: getBookCountPerPage(),
    }));

    // 保存 resize 监听器引用（节流，避免拖拽窗口时频繁触发）
    const resizeHandler = throttle(() => {
      //recount the book count per page when the window is resized
      props.handleFetchBooks();
    });
    window.addEventListener("resize", resizeHandler);

    // 设置滚动监听器
    const scrollContainerCurrent = scrollContainer.current;
    const scrollHandler = () => {
      handleScrollRef.current();
    };
    if (scrollContainerCurrent) {
      scrollContainerCurrent.addEventListener("scroll", scrollHandler);
    }

    // 保存 visibilitychange 监听器引用
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

    // 初始加载完整的书籍数据
    loadFullBooksData();

    return () => {
      // 清理滚动监听器
      if (scrollContainerCurrent) {
        scrollContainerCurrent.removeEventListener("scroll", scrollHandler);
      }

      // 清理 resize 监听器
      window.removeEventListener("resize", resizeHandler);

      // 清理 visibilitychange 监听器
      document.removeEventListener("visibilitychange", visibilityChangeHandler);

      // 清理 IPC 监听器（只移除自身，避免误删 Header 等其他组件的监听器）
      if (isElectron && readingFinishedHandler) {
        ipcRenderer.removeListener("reading-finished", readingFinishedHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate: 当书籍列表更新时，重置显示数量
  const prevPropsRef = useRef({
    books: props.books,
    searchResults: props.searchResults,
    isSearch: props.isSearch,
    mode: props.mode,
    shelfTitle: props.shelfTitle,
  });
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    prevPropsRef.current = {
      books: props.books,
      searchResults: props.searchResults,
      isSearch: props.isSearch,
      mode: props.mode,
      shelfTitle: props.shelfTitle,
    };
    if (
      prevProps.books !== props.books ||
      prevProps.searchResults !== props.searchResults ||
      prevProps.isSearch !== props.isSearch ||
      prevProps.mode !== props.mode ||
      prevProps.shelfTitle !== props.shelfTitle
    ) {
      setState((prevState) => ({
        ...prevState,
        displayedBooksCount: getBookCountPerPage(),
        isLoadingMore: false,
      }));
      props.handleLoadMore(false);
      // 滚动到顶部
      if (scrollContainer.current) {
        scrollContainer.current.scrollTop = 0;
      }
      // 重新加载完整的书籍数据
      loadFullBooksData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.books,
    props.searchResults,
    props.isSearch,
    props.mode,
    props.shelfTitle,
  ]);

  // componentDidUpdate: 阅读状态筛选变化时，重新加载完整书籍数据
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
    if (books.length === 0 && !props.isSearch) {
      return <Redirect to="/manager/empty" />;
    }
    if (bookMode !== currentBookMode) {
      currentBookMode = bookMode;
    }

    // 使用状态中已加载的完整书籍数据，并按当前过滤后的 books 顺序/范围进行裁剪
    const filteredKeys = new Set(books.map((b) => b.key));
    const displayedBooks = props.isSearch
      ? books
      : state.fullBooksData.filter((b) => filteredKeys.has(b.key));

    return displayedBooks.map((item: BookModel, index: number) => {
      if (collectionUtil.isCollection(item.key)) {
        const collection = collectionUtil.getCollection(item.key);
        if (!collection) return null;
        const collectionProps = {
          collection,
          isSelected: props.selectedBooks.indexOf(item.key) > -1,
          allBooks: displayedBooks,
          bookIndex: index,
        };
        return props.viewMode === "list" ? (
          <CollectionItem
            key={item.key}
            {...({ ...collectionProps, viewMode: "list" } as any)}
          />
        ) : props.viewMode === "card" ? (
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
      return props.viewMode === "list" ? (
        <BookListItem
          key={index}
          {...({
            book: item,
            isSelected: props.selectedBooks.indexOf(item.key) > -1,
            allBooks: displayedBooks,
            bookIndex: index,
          } as any)}
        />
      ) : props.viewMode === "card" ? (
        <BookCardItem
          key={index}
          {...({
            book: item,
            cardScale: state.cardScale,
            isSelected: props.selectedBooks.indexOf(item.key) > -1,
            allBooks: displayedBooks,
            bookIndex: index,
          } as any)}
        />
      ) : (
        <BookCoverItem
          key={index}
          {...({
            book: item,
            isSelected: props.selectedBooks.indexOf(item.key) > -1,
            allBooks: displayedBooks,
            bookIndex: index,
          } as any)}
        />
      );
    });
  };

  if (
    (state.favoriteBooks === 0 && props.mode === "favorite") ||
    !props.books ||
    !props.books[0]
  ) {
    return <Redirect to="/manager/empty" />;
  }
  const { books, bookMode } = handleBooks();
  return (
    <>
      <div
        className="book-list-header"
        style={
          props.isCollapsed
            ? { width: "calc(100% - 70px)", left: "70px" }
            : {}
        }
      >
        <SelectBook />

        <div
          style={props.isSelectBook ? { display: "none" } : {}}
          className="book-list-header-right"
        >
          {props.viewMode === "card" && (
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
            <Trans i18nKey="Total books" count={books.length}>
              {"Total " + books.length + " books"}
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
              {props.t("All")}
            </option>
            <option value="unread" className="lang-setting-option">
              {props.t("Unread")}
            </option>
            <option value="reading" className="lang-setting-option">
              {props.t("CurrentlyReading")}
            </option>
            <option value="finished" className="lang-setting-option">
              {props.t("Finished")}
            </option>
          </select>
          <ViewMode />
        </div>
      </div>
      <div
        className="book-list-container-parent"
        style={
          props.isCollapsed
            ? { width: "calc(100vw - 70px)", left: "70px" }
            : {}
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
            {renderBookList(books, bookMode)}
          </ul>
        </div>
      </div>
    </>
  );
};

export default withRouter(BookList as any);
