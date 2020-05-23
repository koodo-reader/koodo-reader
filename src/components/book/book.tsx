//卡片模式下的图书显示
import React from "react";
import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";
import RecentBooks from "../../utils/recordRecent";
import BookModel from "../../model/Book";
import "./book.css";

export interface BookProps {
  book: BookModel;
  bookCover: string;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleReadingEpub: (epub: object) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
}
export interface BookState {
  isDeleteDialog: boolean;
  isOpenConfig: boolean;
}
class Book extends React.Component<BookProps, BookState> {
  epub: any;
  constructor(props: BookProps) {
    super(props);
    this.state = { isDeleteDialog: false, isOpenConfig: false };
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
  //控制按钮的弹出
  handleConfig = (mode: boolean) => {
    // console.log(mode, "mode");
    this.setState({ isOpenConfig: mode });
  };
  render() {
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
const mapStateToProps = () => {
  return {};
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
};
export default connect(mapStateToProps, actionCreator)(Book);
