//卡片模式下的图书显示
import React, { Component } from "react";
import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/book.redux";
import RecentBooks from "../../utils/recordRecent";
import "./book.css";

class Book extends Component {
  constructor(props) {
    super(props);
    this.state = { isDeleteDialog: false, isOpenConfig: false };
    this.handleOpenBook = this.handleOpenBook.bind(this);
    this.epub = null;
  }
  UNSAFE_componentWillMount() {
    this.epub = window.ePub({
      bookPath: this.props.book.content,
      restore: false,
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
  //控制按钮的弹出
  handleConfig = (mode) => {
    // console.log(mode, "mode");
    this.setState({ isOpenConfig: mode });
  };
  render() {
    // console.log(this.props.isReading, "agsffh");
    return (
      <div
        className="book-list-item"
        onMouseEnter={() => {
          this.handleConfig(true);
        }}
        onMouseLeave={() => {
          this.handleConfig(false);
        }}
      >
        <img
          className="book-item-cover"
          src={
            this.props.bookCover !== null
              ? this.props.bookCover
              : process.env.NODE_ENV === "production"
              ? "assets/cover.svg"
              : "../../assets/cover.svg"
          }
          alt=""
          onClick={() => {
            this.handleOpenBook();
          }}
        />
        <p className="book-item-title">{this.props.book.name}</p>
        {this.state.isOpenConfig ? (
          <div className="book-item-config">
            <span
              className="icon-add view-icon"
              onClick={() => {
                this.handleAddShelf();
              }}
            ></span>
            <span
              className="icon-delete view-icon"
              onClick={() => {
                this.handleDeleteBook();
              }}
            ></span>
            <span
              className="icon-edit view-icon"
              onClick={() => {
                this.handleEditBook();
              }}
              style={{ fontSize: "15px" }}
            ></span>
          </div>
        ) : null}
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return { isReading: state.book.isReading };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
};
Book = connect(mapStateToProps, actionCreator)(Book);
export default Book;
