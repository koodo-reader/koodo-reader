import React from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookListItem from "../../../components/bookListItem";
import BookCoverItem from "../../../components/bookCoverItem";
import BookModel from "../../../models/Book";
import { BookListProps, BookListState } from "./interface";
import {
  ConfigService,
  SortUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { Redirect, withRouter } from "react-router-dom";
import ViewMode from "../../../components/viewMode";
import SelectBook from "../../../components/selectBook";
import { Trans } from "react-i18next";
import Book from "../../../models/Book";
import { isElectron } from "react-device-detect";
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
      isRefreshing: false,
      displayedBooksCount: getBookCountPerPage(),
      isLoadingMore: false,
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
  }

  async componentDidMount() {
    if (!this.props.books || !this.props.books[0]) {
      return <Redirect to="manager/empty" />;
    }

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
    }
  }
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
    // 模拟异步加载延迟
    setTimeout(() => {
      this.setState({
        displayedBooksCount: Math.min(
          displayedBooksCount + getBookCountPerPage(),
          books.length
        ),
        isLoadingMore: false,
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

    // 只渲染指定数量的图书
    const displayedBooks = books.slice(0, this.state.displayedBooksCount);

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
  isElementInViewport = (element) => {
    const rect = element.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
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
        ? this.handleIndexFilter(this.props.books, this.props.searchResults)
        : bookMode === "shelf"
        ? this.handleIndexFilter(
            this.handleShelf(this.props.books, this.props.shelfTitle),
            SortUtil.sortBooks(
              this.handleShelf(this.props.books, this.props.shelfTitle),
              this.props.bookSortCode,
              ConfigService
            ) || []
          )
        : bookMode === "favorite"
        ? this.handleIndexFilter(
            this.handleKeyFilter(
              this.props.books,
              ConfigService.getAllListConfig("favoriteBooks")
            ),
            SortUtil.sortBooks(
              this.handleKeyFilter(
                this.props.books,
                ConfigService.getAllListConfig("favoriteBooks")
              ),
              this.props.bookSortCode,
              ConfigService
            ) || []
          )
        : bookMode === "hide"
        ? this.handleIndexFilter(
            this.handleFilterShelfBook(this.props.books),
            SortUtil.sortBooks(
              this.handleFilterShelfBook(this.props.books),
              this.props.bookSortCode,
              ConfigService
            ) || []
          )
        : this.handleIndexFilter(
            this.props.books,
            SortUtil.sortBooks(
              this.props.books,
              this.props.bookSortCode,
              ConfigService
            ) || []
          );

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
    const hasMoreBooks = this.state.displayedBooksCount < books.length;

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
              {!this.state.isRefreshing && this.renderBookList(books, bookMode)}
            </ul>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(BookList as any);
