//全部图书，最近阅读，搜索结果，排序结果的数据
import React from "react";
import "./booklist.css";
import Book from "../../components/book";
import BookItem from "../../components/bookItem";
import AddFavorite from "../../utils/addFavorite";
import RecordRecent from "../../utils/recordRecent";
import ShelfUtil from "../../utils/shelfUtil";
import SortUtil from "../../utils/sortUtil";
import BookModel from "../../model/Book";
import { Trans } from "react-i18next";
import { BookListProps } from "./interface";
import OtherUtil from "../../utils/otherUtil";

class BookList extends React.Component<BookListProps> {
  handleFavorite = (items: any[], arr: string[]) => {
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
  //根据localstorage列表的数据，得到最近阅读的图书
  handleRecent = (items: any[], arr: string[]) => {
    let itemArr: any[] = [];
    //兼容之前的版本
    if (!arr[0] || arr.length !== items.length) {
      RecordRecent.setAllRecent(items);
      return items;
    }
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
    if (index === -1) return;
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    //获取当前书架名
    let currentShelfTitle = shelfTitle[index + 1];
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
    OtherUtil.setReaderConfig("isList", mode);
    this.props.handleFetchList();
  };
  //根据搜索图书index获取到搜索出的图书
  handleFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };
  renderBookList = () => {
    //根据不同的场景获取不同的图书数据
    let books =
      this.props.shelfIndex !== -1
        ? this.handleShelf(this.props.books, this.props.shelfIndex)
        : this.props.isSearch
        ? this.handleFilter(this.props.books, this.props.searchBooks)
        : this.props.mode === "favorite" && !this.props.isSort
        ? this.handleFavorite(this.props.books, AddFavorite.getAllFavorite())
        : this.props.mode === "favorite" && this.props.isSort
        ? this.handleFilter(
            this.handleFavorite(this.props.books, AddFavorite.getAllFavorite()),
            //返回排序后的图书index
            SortUtil.sortBooks(this.props.books, this.props.sortCode) || []
          )
        : this.props.isSort
        ? this.handleFilter(
            this.props.books,
            //返回排序后的图书index
            SortUtil.sortBooks(this.props.books, this.props.sortCode) || []
          )
        : this.handleRecent(this.props.books, RecordRecent.getAllRecent());
    //根据不同的场景获取不同图书的封面
    let covers =
      this.props.shelfIndex !== -1
        ? this.handleShelf(this.props.covers, this.props.shelfIndex)
        : this.props.isSearch
        ? this.handleFilter(this.props.covers, this.props.searchBooks)
        : this.props.mode === "favorite" && !this.props.isSort
        ? this.handleFavorite(this.props.covers, AddFavorite.getAllFavorite())
        : this.props.mode === "favorite" && this.props.isSort
        ? this.handleFilter(
            this.handleFavorite(
              this.props.covers,
              AddFavorite.getAllFavorite()
            ),
            SortUtil.sortBooks(this.props.books, this.props.sortCode) || []
          )
        : this.props.isSort
        ? this.handleFilter(
            this.props.covers,
            SortUtil.sortBooks(this.props.books, this.props.sortCode) || []
          )
        : this.handleRecent(this.props.covers, RecordRecent.getAllRecent());
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
  shouldComponentUpdate(nextProps: BookListProps) {
    if (nextProps.books.length !== nextProps.covers.length) {
      return false;
    }
    return true;
  }
  render() {
    OtherUtil.setReaderConfig("totalBooks", this.props.books.length.toString());
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
              <span className="icon-grid"></span>
              <Trans>Card Mode</Trans>
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

          <div className="book-list-item-box">{this.renderBookList()}</div>
        </div>
      </div>
    );
  }
}

export default BookList;
