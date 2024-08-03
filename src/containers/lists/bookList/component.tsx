import React from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookListItem from "../../../components/bookListItem";
import BookCoverItem from "../../../components/bookCoverItem";
import AddFavorite from "../../../utils/readUtils/addFavorite";
import ShelfUtil from "../../../utils/readUtils/shelfUtil";
import SortUtil from "../../../utils/readUtils/sortUtil";
import BookModel from "../../../models/Book";
import { BookListProps, BookListState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { Redirect, withRouter } from "react-router-dom";
import ViewMode from "../../../components/viewMode";
import { backup } from "../../../utils/syncUtils/backupUtil";
import { isElectron } from "react-device-detect";
import SelectBook from "../../../components/selectBook";
import { Trans } from "react-i18next";
import DeletePopup from "../../../components/dialogs/deletePopup";

declare var window: any;
class BookList extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {
      isOpenDelete: false,
      favoriteBooks: Object.keys(AddFavorite.getAllFavorite()).length,
      isHideShelfBook: StorageUtil.getReaderConfig("isHideShelfBook") === "yes",
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
      return ShelfUtil.getBookPosition(item.key).length === 0;
    });
  };
  renderBookList = () => {
    //get different book data according to different scenes
    let books = this.props.isSearch
      ? this.handleIndexFilter(this.props.books, this.props.searchResults)
      : this.props.shelfIndex > 0
      ? this.handleIndexFilter(
          this.handleShelf(this.props.books, this.props.shelfIndex),
          SortUtil.sortBooks(this.props.books, this.props.bookSortCode) || []
        )
      : this.props.mode === "favorite"
      ? this.handleIndexFilter(
          this.handleKeyFilter(this.props.books, AddFavorite.getAllFavorite()),
          SortUtil.sortBooks(this.props.books, this.props.bookSortCode) || []
        )
      : this.state.isHideShelfBook
      ? this.handleIndexFilter(
          this.handleFilterShelfBook(this.props.books),
          SortUtil.sortBooks(this.props.books, this.props.bookSortCode) || []
        )
      : this.handleIndexFilter(
          this.props.books,
          SortUtil.sortBooks(this.props.books, this.props.bookSortCode) || []
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
    if (this.props.shelfIndex < 1) return;
    let shelfTitles = Object.keys(ShelfUtil.getShelf());
    let currentShelfTitle = shelfTitles[this.props.shelfIndex];
    ShelfUtil.removeShelf(currentShelfTitle);

    this.props.handleShelfIndex(-1);
    this.props.handleMode("home");
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
    if (isElectron) {
      //accommodate the previous version
      window.localforage.getItem(this.props.books[0].key).then((result) => {
        if (result) {
          backup(
            this.props.books,
            this.props.notes,
            this.props.bookmarks,
            false
          );
        }
      });
    }

    StorageUtil.setReaderConfig(
      "totalBooks",
      this.props.books.length.toString()
    );
    const deletePopupProps = {
      mode: "shelf",
      name: Object.keys(ShelfUtil.getShelf())[this.props.shelfIndex],
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
          {this.props.shelfIndex > -1 && !this.props.isSelectBook && (
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
