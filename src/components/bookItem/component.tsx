//控制列表模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/recordRecent";
import "./bookItem.css";
import RecordLocation from "../../utils/recordLocation";
import { BookItemProps, BookItemState } from "./interface";

class Book extends React.Component<BookItemProps, BookItemState> {
  epub: any;
  constructor(props: BookItemProps) {
    super(props);
    this.state = { isDeleteDialog: false };
    this.handleOpenBook = this.handleOpenBook.bind(this);
    this.epub = null;
  }
  UNSAFE_componentWillMount() {
    this.epub = (window as any).ePub({
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
  render() {
    let percentage = RecordLocation.getCfi(this.props.book.key)
      ? RecordLocation.getCfi(this.props.book.key).percentage
      : 0;
    return (
      <div className="book-list-item-container">
        <img
          className="book-item-list-cover"
          src={
            this.props.bookCover
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
        <p className="book-item-list-title">{this.props.book.name}</p>
        <p className="book-item-list-author">{this.props.book.author}</p>
        <p className="book-item-list-percentage">
          {this.props.percentage ? Math.round(percentage * 100) : 0}%
        </p>
        <div className="book-item-list-config">
          <span
            className="icon-add1 list-icon"
            onClick={() => {
              this.handleAddShelf();
            }}
            color="rgba(75,75,75,1)"
          ></span>
          <span
            className="icon-delete1 list-icon"
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

export default Book;
