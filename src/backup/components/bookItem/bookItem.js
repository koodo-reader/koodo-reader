//控制列表模式下的图书显示
import React, { Component } from "react";
import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub
} from "../../redux/book.redux";
import RecentBooks from "../../utils/recordRecent";
import "./bookItem.css";
import RecordRecent from "../../utils/recordRecent";
import RecordLocation from "../../utils/recordLocation";
class Book extends Component {
  constructor(props) {
    super(props);
    this.state = { isDeleteDialog: false };
    this.handleOpenBook = this.handleOpenBook.bind(this);
    this.epub = null;
  }
  UNSAFE_componentWillMount() {
    this.epub = window.ePub({
      bookPath: this.props.book.content,
      restore: false
    });
  }
  handleOpenBook() {
    this.props.handleReadingBook(this.props.book);
    this.props.handleReadingEpub(this.epub);
    this.props.handleReadingState(true);
    RecentBooks.setRecent(this.props.book.key);
  }
  handleDeleteBook = () => {
    this.props.handleDeleteDialog(true);
    this.props.handleReadingBook(this.props.book);
  };
  handleEditBook = () => {
    this.props.handleEditDialog(true);
    this.props.handleReadingBook(this.props.book);
  };
  handleAddShelf = () => {
    this.props.handleAddDialog(true);
    this.props.handleReadingBook(this.props.book);
  };
  render() {
    // console.log(this.props.isReading, "agsffh");
    let date =
      RecordRecent.getRecent()[this.props.book.key] !== null &&
      RecordRecent.getRecent()[this.props.book.key] !== undefined
        ? RecordRecent.getRecent()[this.props.book.key].date
        : { year: "0000", month: "00", day: "00" };
    let percentage =
      RecordLocation.getCfi(this.props.book.key) !== null &&
      RecordLocation.getCfi(this.props.book.key) !== undefined
        ? RecordLocation.getCfi(this.props.book.key).percentage
        : 0;
    return (
      <div className="book-list-item-container">
        <img
          className="book-item-list-cover"
          src={
            this.props.bookCover !== null
              ? this.props.bookCover
              : "assets/cover.jpg"
          }
          alt=""
          onClick={() => {
            this.handleOpenBook();
          }}
        />
        <p className="book-item-list-title">{this.props.book.name}</p>
        <p className="book-item-list-author">{this.props.book.author}</p>
        <p className="book-item-list-date">
          {"" + date.year + "-" + date.month + "-" + date.day}
        </p>
        <p className="book-item-list-percentage">
          {this.props.percentage !== null ? Math.round(percentage * 100) : 0}%
        </p>
        <div className="book-item-list-config">
          <span
            className="icon-add list-icon"
            onClick={() => {
              this.handleAddShelf();
            }}
            color="rgba(75,75,75,1)"
          ></span>
          <span
            className="icon-delete list-icon"
            onClick={() => {
              this.handleDeleteBook();
            }}
          ></span>
          <span
            className="icon-edit list-icon"
            onClick={() => {
              this.handleEditBook();
            }}
          ></span>
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    isReading: state.book.isReading,
    percentage: state.progressPanel.percentage
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog
};
Book = connect(mapStateToProps, actionCreator)(Book);
export default Book;
