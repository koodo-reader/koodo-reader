import React from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookCoverItem from "../../../components/bookCoverItem";
import BookListItem from "../../../components/bookListItem";
import AddTrash from "../../../utils/readUtils/addTrash";
import RecordRecent from "../../../utils/readUtils/recordRecent";
import SortUtil from "../../../utils/readUtils/sortUtil";
import BookModel from "../../../model/Book";
import { Trans } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
import Empty from "../../emptyPage";
import { withRouter } from "react-router-dom";
import ViewMode from "../../../components/viewMode";

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
    let books = !this.props.isBookSort
      ? this.handleKeyFilter(this.props.deletedBooks, AddTrash.getAllTrash())
      : this.props.isBookSort
      ? this.handleIndexFilter(
          this.handleKeyFilter(this.props.deletedBooks, AddTrash.getAllTrash()),
          //返回排序后的图书index
          SortUtil.sortBooks(
            this.props.deletedBooks,
            this.props.bookSortCode
          ) || []
        )
      : this.props.isBookSort
      ? this.handleIndexFilter(
          this.props.deletedBooks,
          //返回排序后的图书index
          SortUtil.sortBooks(
            this.props.deletedBooks,
            this.props.bookSortCode
          ) || []
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
      return this.props.viewMode === "list" ? (
        <BookListItem
          {...{
            key: item.key,
            book: item,
          }}
        />
      ) : this.props.viewMode === "card" ? (
        <BookCardItem
          key={item.key}
          book={item}
          isSelected={this.props.selectedBooks.indexOf(item.key) > -1}
        />
      ) : (
        <BookCoverItem
          key={item.key}
          book={item}
          isSelected={this.props.selectedBooks.indexOf(item.key) > -1}
        />
      );
    });
  };

  render() {
    return (
      <>
        <ViewMode />
        <div
          className="booklist-delete-container"
          onClick={() => {
            this.props.handleDeleteDialog(true);
          }}
          style={this.props.isCollapsed ? { left: "calc(50% - 60px)" } : {}}
        >
          <Trans>Delete All Books</Trans>
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
            <ul className="book-list-item-box">{this.renderBookList()}</ul>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(BookList);
