//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/recordRecent";
import "./book.css";
import { BookProps, BookState } from "./interface";
import AddFavorite from "../../utils/addFavorite";
class Book extends React.Component<BookProps, BookState> {
  epub: any;
  constructor(props: BookProps) {
    super(props);
    this.state = {
      isDeleteDialog: false,
      isOpenConfig: false,
      isFavorite: false,
    };
    this.handleOpenBook = this.handleOpenBook.bind(this);
    this.epub = null;
  }
  UNSAFE_componentWillMount() {
    this.epub = (window as any).ePub({
      bookPath: this.props.book.content,
      restore: false,
    });

    this.setState({
      isFavorite:
        AddFavorite.getAllFavorite().indexOf(this.props.book.key) > -1,
    });
  }
  handleOpenBook() {
    this.props.handleReadingBook(this.props.book);
    this.props.handleReadingEpub(this.epub);
    this.props.handleReadingState(true);
    RecentBooks.setRecent(this.props.book.key);
  }
  handleMoreAction = () => {
    this.props.handleActionDialog(true);
    this.props.handleReadingBook(this.props.book);
  };
  handleLoveBook = () => {
    AddFavorite.setFavorite(this.props.book.key);
    this.setState({ isFavorite: true });
  };
  handleCancelLoveBook = () => {
    AddFavorite.clear(this.props.book.key);
    this.setState({ isFavorite: false });
  };
  //控制按钮的弹出
  handleConfig = (mode: boolean) => {
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
        {this.props.bookCover ? (
          <img
            className="book-item-cover"
            src={this.props.bookCover}
            alt=""
            onClick={() => {
              this.handleOpenBook();
            }}
          />
        ) : (
          <div
            className="book-item-cover"
            onClick={() => {
              this.handleOpenBook();
            }}
          >
            <div className="book-item-cover-img">
              <img src="/assets/cover.svg" alt="" style={{ width: "80%" }} />
            </div>

            <p className="book-item-cover-title">
              <span>{this.props.book.name}</span>
            </p>
          </div>
        )}

        <p className="book-item-title">{this.props.book.name}</p>
        {this.state.isFavorite ? (
          <span
            className="icon-love book-loved-icon"
            onClick={() => {
              this.handleCancelLoveBook();
            }}
          ></span>
        ) : null}

        {this.state.isOpenConfig ? (
          <>
            <span
              className="icon-more book-more-action"
              onClick={() => {
                this.handleMoreAction();
              }}
            ></span>
            <span
              className="icon-love book-love-icon"
              onClick={() => {
                this.handleLoveBook();
              }}
            ></span>
          </>
        ) : null}
      </div>
    );
  }
}
export default Book;
