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
import DeletePopup from "../../../components/dialogs/deletePopup";

declare var window: any;
class BookList extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {
      isOpenDelete: false,
      favoriteBooks: Object.keys(
        ConfigService.getAllListConfig("favoriteBooks")
      ).length,
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      isRefreshing: false,
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
  }

  async componentDidMount() {
    if (!this.props.books || !this.props.books[0]) {
      return <Redirect to="manager/empty" />;
    }
    setTimeout(() => {
      this.lazyLoad();
      window.addEventListener("scroll", this.lazyLoad);
      window.addEventListener("resize", this.lazyLoad);
    }, 0);
  }

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
  renderBookList = () => {
    //get different book data according to different scenes
    let books = this.props.isSearch
      ? this.handleIndexFilter(this.props.books, this.props.searchResults)
      : this.props.shelfTitle
      ? this.handleIndexFilter(
          this.handleShelf(this.props.books, this.props.shelfTitle),
          SortUtil.sortBooks(
            this.handleShelf(this.props.books, this.props.shelfTitle),
            this.props.bookSortCode,
            ConfigService
          ) || []
        )
      : this.props.mode === "favorite"
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
      : this.state.isHideShelfBook
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
    if (books.length === 0 && !this.props.isSearch) {
      return <Redirect to="/manager/empty" />;
    }
    setTimeout(() => {
      this.lazyLoad();
    }, 0);
    let listElements = document.querySelector(".book-list-item-box");
    let covers = listElements?.querySelectorAll("img");
    covers?.forEach((cover) => {
      if (!cover.classList.contains("lazy-image")) {
        cover.classList.add("lazy-image");
      }
    });
    return books.map((item: BookModel, index: number) => {
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
  handleDeleteShelf = () => {
    if (!this.props.shelfTitle) return;
    let shelfTitles = Object.keys(ConfigService.getAllMapConfig("shelfList"));
    let currentShelfTitle = this.props.shelfTitle;
    ConfigService.deleteMapConfig(currentShelfTitle, "shelfList");

    this.props.handleShelf("");
    this.props.handleMode("home");
    this.props.history.push("/manager/home");
  };
  handleDeletePopup = (isOpenDelete: boolean) => {
    this.setState({ isOpenDelete });
  };
  lazyLoad = () => {
    const lazyImages: any = document.querySelectorAll(".lazy-image");
    lazyImages.forEach((lazyImage) => {
      if (this.isElementInViewport(lazyImage) && lazyImage.dataset.src) {
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.classList.remove("lazy-image");
      }
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
  render() {
    if (
      (this.state.favoriteBooks === 0 && this.props.mode === "favorite") ||
      !this.props.books ||
      !this.props.books[0]
    ) {
      return <Redirect to="/manager/empty" />;
    }

    ConfigService.setReaderConfig(
      "totalBooks",
      this.props.books.length.toString()
    );
    const deletePopupProps = {
      mode: "shelf",
      name: this.props.shelfTitle,
      title: "Delete this shelf",
      description: "This action will clear and remove this shelf",
      handleDeletePopup: this.handleDeletePopup,
      handleDeleteOpearion: this.handleDeleteShelf,
    };
    return (
      <>
        {this.state.isOpenDelete && <DeletePopup {...deletePopupProps} />}
        <div
          className="book-list-header"
          style={
            this.props.isCollapsed
              ? { width: "calc(100% - 70px)", left: "70px" }
              : {}
          }
        >
          <SelectBook />
          {this.props.shelfTitle && !this.props.isSelectBook && (
            <div
              className="booklist-delete-container"
              onClick={() => {
                this.handleDeletePopup(true);
              }}
            >
              <Trans>Delete this shelf</Trans>
            </div>
          )}
          <div style={this.props.isSelectBook ? { display: "none" } : {}}>
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
            <ul
              className="book-list-item-box"
              onScroll={() => {
                this.lazyLoad();
              }}
            >
              {!this.state.isRefreshing && this.renderBookList()}
            </ul>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(BookList as any);
