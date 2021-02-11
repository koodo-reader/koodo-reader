//全部图书，最近阅读，搜索结果，排序结果的数据
import React from "react";
import "./booklist.css";
import BookCardItem from "../../components/bookCardtem";
import BookListItem from "../../components/bookListItem";
import BookCoverItem from "../../components/bookCoverItem";
import AddFavorite from "../../utils/readUtils/addFavorite";
import RecordRecent from "../../utils/readUtils/recordRecent";
import ShelfUtil from "../../utils/readUtils/shelfUtil";
import SortUtil from "../../utils/readUtils/sortUtil";
import BookModel from "../../model/Book";
import { Trans, NamespacesConsumer } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import localforage from "localforage";
import DeletePopup from "../../components/deletePopup";
import Empty from "../emptyPage";
import { Redirect, withRouter } from "react-router-dom";
import ViewMode from "../../components/viewMode";
import BackUtil from "../../utils/syncUtils/backupUtil";
import isElectron from "is-electron";

class BookList extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {
      shelfIndex: 0,
      isOpenDelete: false,
      favoriteBooks: Object.keys(AddFavorite.getAllFavorite()).length,
    };
  }
  componentWillMount() {
    if (this.props.mode === "trash") {
      this.props.handleFetchBooks(true);
    } else {
      this.props.handleFetchBooks(false);
    }
  }
  componentDidMount() {
    if (!this.props.books || !this.props.books[0]) {
      return <Redirect to="manager/empty" />;
    }
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

  //获取书架数据
  handleShelf(items: any, index: number) {
    //获取书架名
    if (index < 1) return items;
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    //获取当前书架名
    let currentShelfTitle = shelfTitle[index];
    if (!currentShelfTitle) return items;
    //获取当前书架的图书列表
    let currentShelfList = ShelfUtil.getShelf()[currentShelfTitle];
    //根据图书列表获取到图书数据
    let shelfItems = items.filter((item: { key: number }) => {
      return currentShelfList.indexOf(item.key) > -1;
    });
    return shelfItems;
  }
  //控制卡片模式和列表模式的切换
  handleChange = (mode: string) => {
    OtherUtil.setReaderConfig("viewMode", mode);
    this.props.handleFetchList();
  };
  //根据搜索图书index获取到搜索出的图书
  handleIndexFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });

    return itemArr;
  };
  renderBookList = () => {
    //根据不同的场景获取不同的图书数据
    let books = this.props.isSearch
      ? this.handleIndexFilter(this.props.books, this.props.searchResults)
      : this.props.shelfIndex > 0
      ? this.handleShelf(this.props.books, this.props.shelfIndex)
      : this.props.mode === "favorite" && !this.props.isBookSort
      ? this.handleKeyFilter(this.props.books, AddFavorite.getAllFavorite())
      : this.props.mode === "favorite" && this.props.isBookSort
      ? this.handleIndexFilter(
          this.handleKeyFilter(this.props.books, AddFavorite.getAllFavorite()),
          //返回排序后的图书index
          SortUtil.sortBooks(this.props.books, this.props.bookSortCode) || []
        )
      : this.props.isBookSort && this.props.bookSortCode.sort !== 0
      ? this.handleIndexFilter(
          this.props.books,
          //返回排序后的图书index
          SortUtil.sortBooks(this.props.books, this.props.bookSortCode) || []
        )
      : this.handleKeyFilter(this.props.books, RecordRecent.getAllRecent());
    if (this.props.mode === "shelf" && books.length === 0) {
      return (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
          }}
        >
          <Empty />
        </div>
      );
    }

    return books.map((item: BookModel, index: number) => {
      return this.props.viewMode === "list" ? (
        <BookListItem
          {...{
            key: item.key,
            book: item,
          }}
        />
      ) : this.props.viewMode === "card" ? (
        <BookCardItem key={item.key} book={item} />
      ) : (
        <BookCoverItem
          {...{
            key: item.key,
            book: item,
          }}
        />
      );
    });
  };
  //切换书架
  handleShelfItem = (event: any) => {
    let index = event.target.value.split(",")[1];
    this.setState({ shelfIndex: index });
    this.props.handleShelfIndex(index);
    if (index > 0) {
      this.props.handleMode("shelf");
    } else {
      this.props.handleMode("home");
    }
  };
  handleDeleteShelf = () => {
    if (this.state.shelfIndex < 1) return;
    let shelfTitles = Object.keys(ShelfUtil.getShelf());
    //获取当前书架名
    let currentShelfTitle = shelfTitles[this.state.shelfIndex];
    ShelfUtil.removeShelf(currentShelfTitle);
    this.setState({ shelfIndex: 0 }, () => {
      this.props.handleShelfIndex(0);
      this.props.handleMode("shelf");
    });
  };
  renderShelfList = () => {
    let shelfList = ShelfUtil.getShelf();
    let shelfTitle = Object.keys(shelfList);
    return shelfTitle.map((item, index) => {
      return (
        <NamespacesConsumer key={index}>
          {(t) => (
            <option
              value={[item, index.toString()]}
              key={index}
              className="add-dialog-shelf-list-option"
              selected={this.props.shelfIndex === index ? true : false}
            >
              {t(item === "New" ? "All Books" : item)}
            </option>
          )}
        </NamespacesConsumer>
      );
    });
  };
  handleDeletePopup = (isOpenDelete: boolean) => {
    this.setState({ isOpenDelete });
  };
  render() {
    if (
      (this.state.favoriteBooks === 0 && this.props.mode === "favorite") ||
      !this.props.books ||
      !this.props.books[0]
    ) {
      return <Redirect to="/manager/empty" />;
    }
    if (isElectron()) {
      localforage.getItem(this.props.books[0].key).then((result) => {
        if (result) {
          BackUtil.backup(
            this.props.books,
            this.props.notes,
            this.props.bookmarks,
            () => {},
            4,
            () => {}
          );
        }
      });
    }
    const deletePopupProps = {
      mode: "shelf",
      name: Object.keys(ShelfUtil.getShelf())[this.state.shelfIndex],
      title: "Delete this shelf",
      description: "This action will clear and remove this shelf",
      handleDeletePopup: this.handleDeletePopup,
      handleDeleteOpearion: this.handleDeleteShelf,
    };
    OtherUtil.setReaderConfig("totalBooks", this.props.books.length.toString());
    return (
      <>
        {this.state.isOpenDelete && <DeletePopup {...deletePopupProps} />}
        <ViewMode />
        {this.props.mode === "trash" ? (
          <div
            className="booklist-delete-container"
            onClick={() => {
              this.props.handleDeleteDialog(true);
            }}
          >
            <Trans>Delete All Books</Trans>
          </div>
        ) : (
          <div className="booklist-shelf-container">
            <p className="general-setting-title" style={{ display: "inline" }}>
              <Trans>My Shelves</Trans>
            </p>
            <select
              className="booklist-shelf-list"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                this.handleShelfItem(event);
              }}
            >
              {this.renderShelfList()}
            </select>
            {this.state.shelfIndex > 0 ? (
              <span
                className="icon-trash delete-shelf-icon"
                onClick={() => {
                  this.handleDeletePopup(true);
                }}
              ></span>
            ) : null}
          </div>
        )}
        <div className="book-list-container-parent">
          <div className="book-list-container">
            <ul className="book-list-item-box">{this.renderBookList()}</ul>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(BookList);
