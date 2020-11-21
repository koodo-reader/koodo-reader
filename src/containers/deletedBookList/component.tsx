//全部图书，最近阅读，搜索结果，排序结果的数据
import React from "react";
import "./booklist.css";
import Book from "../../components/bookCardtem";
import BookItem from "../../components/bookListItem";
import AddTrash from "../../utils/addTrash";
import RecordRecent from "../../utils/recordRecent";
import SortUtil from "../../utils/sortUtil";
import BookModel from "../../model/Book";
import { Trans } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import Empty from "../emptyPage";
import { withRouter } from "react-router-dom";

declare var window: any;

class BookList extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {};
  }
  componentWillMount() {
    this.props.handleFetchBooks(true);
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

  //控制卡片模式和列表模式的切换
  handleChange = (mode: string) => {
    OtherUtil.setReaderConfig("isList", mode);
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
    let books = !this.props.isSort
      ? this.handleKeyFilter(this.props.deletedBooks, AddTrash.getAllTrash())
      : this.props.isSort
      ? this.handleIndexFilter(
          this.handleKeyFilter(this.props.deletedBooks, AddTrash.getAllTrash()),
          //返回排序后的图书index
          SortUtil.sortBooks(this.props.deletedBooks, this.props.sortCode) || []
        )
      : this.props.isSort
      ? this.handleIndexFilter(
          this.props.deletedBooks,
          //返回排序后的图书index
          SortUtil.sortBooks(this.props.deletedBooks, this.props.sortCode) || []
        )
      : this.handleKeyFilter(
          this.props.deletedBooks,
          RecordRecent.getAllRecent()
        );
    if (books.length === 0) {
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
      return this.props.isList === "list" ? (
        <BookItem
          {...{
            key: item.key,
            book: item,
          }}
        />
      ) : (
        <Book key={item.key} book={item} />
      );
    });
  };

  render() {
    return (
      <>
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

        <div
          className="booklist-delete-container"
          onClick={() => {
            this.props.handleDeleteDialog(true);
          }}
        >
          <Trans>Delete All Books</Trans>
        </div>

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
