import React from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookListItem from "../../../components/bookListItem";
import BookCoverItem from "../../../components/bookCoverItem";
import BookModel from "../../../models/Book";
import { BookListProps, BookListState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { Redirect, withRouter } from "react-router-dom";
import ViewMode from "../../../components/viewMode";
import SelectBook from "../../../components/selectBook";
import { Trans } from "react-i18next";
import Book from "../../../models/Book";
import { isElectron } from "react-device-detect";
import DatabaseService from "../../../utils/storage/databaseService";
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

class BookList extends React.Component<BookListProps, BookListState> {
  private scrollContainer: React.RefObject<HTMLUListElement>;
  private visibilityChangeHandler: ((event: Event) => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(props: BookListProps) {
    super(props);
    this.scrollContainer = React.createRef();
    this.state = {
      favoriteBooks: Object.keys(
        ConfigService.getAllListConfig("favoriteBooks")
      ).length,
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      displayedBooksCount: 24,
      isLoadingMore: false,
      fullBooksData: [], // 存储从数据库加载的完整书籍数据
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
  }

  async componentDidMount() {
    if (!this.props.books || !this.props.books[0]) {
      return <Redirect to="manager/empty" />;
    }
    this.setState({
      displayedBooksCount: getBookCountPerPage(),
    });

    // 保存 resize 监听器引用
    this.resizeHandler = () => {
      //recount the book count per page when the window is resized
      this.props.handleFetchBooks();
    };
    window.addEventListener("resize", this.resizeHandler);

    // 设置滚动监听器
    this.setupScrollListener();

    // 保存 visibilitychange 监听器引用
    this.visibilityChangeHandler = async (event) => {
      if (document.visibilityState === "visible" && !isElectron) {
        await this.handleFinishReading();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);

    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.on("reading-finished", async (event: any, config: any) => {
        this.handleFinishReading();
      });
    }

    // 初始加载完整的书籍数据
    await this.loadFullBooksData();
  }

  componentWillUnmount() {
    // 清理滚动监听器
    this.cleanupScrollListener();

    // 清理 resize 监听器
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }

    // 清理 visibilitychange 监听器
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler
      );
      this.visibilityChangeHandler = null;
    }

    // 清理 IPC 监听器
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.removeAllListeners("reading-finished");
    }
  }

  componentDidUpdate(prevProps: BookListProps) {
    // 当书籍列表更新时，重置显示数量
    if (
      prevProps.books !== this.props.books ||
      prevProps.searchResults !== this.props.searchResults ||
      prevProps.isSearch !== this.props.isSearch ||
      prevProps.mode !== this.props.mode ||
      prevProps.shelfTitle !== this.props.shelfTitle
    ) {
      this.setState({
        displayedBooksCount: getBookCountPerPage(),
        isLoadingMore: false,
      });
      this.props.handleLoadMore(false);
      // 滚动到顶部
      if (this.scrollContainer.current) {
        this.scrollContainer.current.scrollTop = 0;
      }
      // 重新加载完整的书籍数据
      this.loadFullBooksData();
    }
  }

  // 从数据库加载完整的书籍数据
  loadFullBooksData = async () => {
    const { books } = this.handleBooks();
    const displayedBooks = books.slice(0, this.state.displayedBooksCount);

    const fullBooksData: Book[] = [];
    for (let i = 0; i < displayedBooks.length; i++) {
      const book = await DatabaseService.getRecord(
        displayedBooks[i].key,
        "books"
      );
      if (book) {
        fullBooksData.push(book);
      }
    }

    this.setState({ fullBooksData });
  };
  handleFinishReading = async () => {
    if (!this.scrollContainer.current) return;
    if (
      this.scrollContainer.current &&
      this.scrollContainer.current.scrollTop > 100
    ) {
      //ignore if the scroll is not at top
    } else {
      this.props.handleFetchBooks();
    }
  };

  setupScrollListener = () => {
    const scrollContainer = this.scrollContainer.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", this.handleScroll);
    }
  };

  cleanupScrollListener = () => {
    const scrollContainer = this.scrollContainer.current;
    if (scrollContainer) {
      scrollContainer.removeEventListener("scroll", this.handleScroll);
    }
  };

  handleScroll = () => {
    const scrollContainer = this.scrollContainer.current;
    if (!scrollContainer || this.state.isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    // 当滚动到底部附近时触发加载更多
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      this.loadMoreBooks();
    }
  };

  loadMoreBooks = () => {
    const { books } = this.handleBooks();
    const { displayedBooksCount } = this.state;

    if (displayedBooksCount >= books.length) {
      return; // 已经显示所有图书
    }

    this.setState({ isLoadingMore: true });
    this.props.handleLoadMore(true);
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
        const book = await DatabaseService.getRecord(newBooks[i].key, "books");
        if (book) {
          newFullBooksData.push(book);
        }
      }

      this.setState({
        displayedBooksCount: newDisplayedBooksCount,
        isLoadingMore: false,
        fullBooksData: [...this.state.fullBooksData, ...newFullBooksData],
      });
    }, 100);
  };

  handleKeyFilter = (items: any[], arr: string[]) => {
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

  handleShelf(items: any, shelfTitle: string) {
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
  }

  //get the searched books according to the index
  handleIndexFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };
  handleFilterShelfBook = (items: BookModel[]) => {
    return items.filter((item) => {
      return (
        ConfigService.getFromAllMapConfig(item.key, "shelfList").length === 0
      );
    });
  };
  renderBookList = (books: Book[], bookMode: string) => {
    if (books.length === 0 && !this.props.isSearch) {
      return <Redirect to="/manager/empty" />;
    }
    if (bookMode !== currentBookMode) {
      currentBookMode = bookMode;
    }

    // 使用状态中已加载的完整书籍数据
    const displayedBooks = this.props.isSearch
      ? books
      : this.state.fullBooksData;

    return displayedBooks.map((item: BookModel, index: number) => {
      return this.props.viewMode === "list" ? (
        <BookListItem
          {...{
            key: index,
            book: item,
            isSelected: this.props.selectedBooks.indexOf(item.key) > -1,
          }}
        />
      ) : this.props.viewMode === "card" ? (
        <BookCardItem
          {...{
            key: index,
            book: item,
            isSelected: this.props.selectedBooks.indexOf(item.key) > -1,
          }}
        />
      ) : (
        <BookCoverItem
          {...{
            key: index,
            book: item,
            isSelected: this.props.selectedBooks.indexOf(item.key) > -1,
          }}
        />
      );
    });
  };
  handleBooks = () => {
    let bookMode = this.props.isSearch
      ? "search"
      : this.props.shelfTitle
      ? "shelf"
      : this.props.mode === "favorite"
      ? "favorite"
      : this.state.isHideShelfBook
      ? "hide"
      : "home";
    let books =
      bookMode === "search"
        ? this.props.searchResults
        : bookMode === "shelf"
        ? this.handleShelf(this.props.books, this.props.shelfTitle)
        : bookMode === "favorite"
        ? this.handleKeyFilter(
            this.props.books,
            ConfigService.getAllListConfig("favoriteBooks")
          )
        : bookMode === "hide"
        ? this.handleFilterShelfBook(this.props.books)
        : this.props.books;
    return {
      books,
      bookMode,
    };
  };

  render() {
    if (
      (this.state.favoriteBooks === 0 && this.props.mode === "favorite") ||
      !this.props.books ||
      !this.props.books[0]
    ) {
      return <Redirect to="/manager/empty" />;
    }
    const { books, bookMode } = this.handleBooks();
    return (
      <>
        <div
          className="book-list-header"
          style={
            this.props.isCollapsed
              ? { width: "calc(100% - 70px)", left: "70px" }
              : {}
          }
        >
          <SelectBook />

          <div
            style={this.props.isSelectBook ? { display: "none" } : {}}
            className="book-list-header-right"
          >
            <div className="book-list-total-page">
              <Trans i18nKey="Total books" count={books.length}>
                {"Total " + books.length + " books"}
              </Trans>
            </div>
            <ViewMode />
          </div>
        </div>
        <div
          className="book-list-container-parent"
          style={
            this.props.isCollapsed
              ? { width: "calc(100vw - 70px)", left: "70px" }
              : {}
          }
        >
          <div className="book-list-container">
            <ul className="book-list-item-box" ref={this.scrollContainer}>
              {this.renderBookList(books, bookMode)}
            </ul>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(BookList as any);
