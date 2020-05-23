//全部图书，最近阅读，搜索结果，排序结果的数据
import React from "react";
import "./booklist.css";
import Book from "../book/book";
import BookItem from "../bookItem/bookItem";
import { connect } from "react-redux";
import { handleFetchList } from "../../redux/actions/manager";
import RecordRecent from "../../utils/recordRecent";
import ShelfUtil from "../../utils/shelfUtil";
import SortUtil from "../../utils/sortUtil";
import BookModel from "../../model/Book";
import { stateType } from "../../redux/store";
import { Trans } from "react-i18next";
import { withNamespaces } from "react-i18next";

export interface BookListProps {
  books: BookModel[];
  covers: { key: string; url: string }[];
  epubs: object[];
  mode: string;
  shelfIndex: number;
  searchBooks: number[];
  isSearch: boolean;
  isSort: boolean;
  isList: string;
  sortCode: { sort: number; order: number };
  handleFetchList: () => void;
}
class BookList extends React.Component<BookListProps> {
  //根据localstorage列表的数据，得到最近阅读的图书
  handleRecent = (items: any) => {
    let recentArr: any = [];
    for (let i in RecordRecent.getRecent()) {
      recentArr.push(RecordRecent.getRecent()[i].bookKey);
    }
    let recentItems: any = items.filter((item: { key: number }) => {
      return recentArr.indexOf(item.key) > -1;
    });
    return recentItems;
  };
  //获取书架数据
  handleShelf(items: any, index: number) {
    //获取书架名
    if (index === -1) {
      return;
    }
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    //获取当前书架名
    let currentShelfTitle = shelfTitle[index + 1];
    //获取当前书架的图书列表
    let currentShelfList = ShelfUtil.getShelf()[currentShelfTitle];
    //根据图书列表获取到图书数据
    console.log(currentShelfList, currentShelfTitle, "currentShelfList");
    let shelfItems = items.filter((item: { key: number }) => {
      return currentShelfList.indexOf(item.key) > -1;
    });
    return shelfItems;
  }
  //控制卡片模式和列表模式的切换
  handleChange = (mode: string) => {
    localStorage.setItem("isList", mode);
    this.props.handleFetchList();
  };
  //根据搜索图书index获取到搜索出的图书
  handleFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      itemArr.push(items[item]);
    });
    return itemArr;
  };
  render() {
    localStorage.setItem("totalBooks", this.props.books.length.toString());

    // console.log(this.props.isList);
    const renderBookList = () => {
      // console.log(this.props.books, "sdgasf");
      //根据不同的场景获取不同的图书数据
      let books =
        this.props.mode === "recent"
          ? this.handleRecent(this.props.books)
          : this.props.shelfIndex !== -1
          ? this.handleShelf(this.props.books, this.props.shelfIndex)
          : this.props.isSearch
          ? this.handleFilter(this.props.books, this.props.searchBooks)
          : this.props.isSort
          ? this.handleFilter(
              this.props.books,
              //返回排序后的图书index
              SortUtil.sortBooks(this.props.books, this.props.sortCode) || []
            )
          : this.props.books;
      //根据不同的场景获取不同图书的封面
      let covers =
        this.props.mode === "recent"
          ? this.handleRecent(this.props.covers)
          : this.props.shelfIndex !== -1
          ? this.handleShelf(this.props.covers, this.props.shelfIndex)
          : this.props.isSearch
          ? this.handleFilter(this.props.covers, this.props.searchBooks)
          : this.props.isSort
          ? this.handleFilter(
              this.props.covers,
              SortUtil.sortBooks(this.props.books, this.props.sortCode) || []
            )
          : this.props.covers;
      return books.map((item: BookModel, index: number) => {
        return this.props.isList === "list" ? (
          <BookItem
            key={item.key}
            book={item}
            bookCover={covers[index] ? covers[index].url : null}
          />
        ) : (
          <Book
            key={item.key}
            book={item}
            bookCover={covers[index] ? covers[index].url : null}
          />
        );
      });
    };
    return (
      <div className="book-list-container-parent">
        <div className="book-list-container">
          <div className="book-list-view">
            <div
              className="card-list-mode"
              onClick={() => {
                this.handleChange("card");
              }}
              style={
                this.props.isList === "card"
                  ? {}
                  : { color: "rgba(75,75,75,0.5)" }
              }
            >
              <span className="icon-grid"></span> <Trans>Card Mode</Trans>
            </div>
            <div
              className="list-view-mode"
              onClick={() => {
                this.handleChange("list");
              }}
              style={
                this.props.isList === "list"
                  ? {}
                  : { color: "rgba(75,75,75,0.5)" }
              }
            >
              <span className="icon-list"></span> <Trans>List Mode</Trans>
            </div>
          </div>

          <div className="book-list-item-box">{renderBookList()}</div>
        </div>
      </div>
    );
  }
}
const mappropsToProps = (props: stateType) => {
  return {
    books: props.manager.books,
    covers: props.manager.covers,
    epubs: props.manager.epubs,
    mode: props.sidebar.mode,
    shelfIndex: props.sidebar.shelfIndex,
    searchBooks: props.manager.searchBooks,
    isSearch: props.manager.isSearch,
    isSort: props.manager.isSort,
    isList: props.manager.isList,
    sortCode: props.manager.sortCode,
  };
};
const actionCreator = { handleFetchList };
export default connect(
  mappropsToProps,
  actionCreator
)(withNamespaces()(BookList as any));
