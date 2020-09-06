//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/recordRecent";
import "./book.css";
import { BookProps, BookState } from "./interface";
import AddFavorite from "../../utils/addFavorite";
import Epub from "epubjs";
import ActionDialog from "../../containers/actionDialog";

declare var window: any;

window.ePub = Epub;

class Book extends React.Component<BookProps, BookState> {
  epub: any;
  constructor(props: BookProps) {
    super(props);
    this.state = {
      isOpenConfig: false,
      isFavorite: false,
      left: 0,
      top: 0,
    };
    this.handleOpenBook = this.handleOpenBook.bind(this);
    this.epub = null;
  }
  UNSAFE_componentWillMount() {
    this.epub = window.ePub(this.props.book.content, {});

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
  handleMoreAction = (event: any) => {
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 100) {
      x = x - 80;
    }
    this.setState({ left: x - 210, top: e.clientY - 100 }, () => {
      this.props.handleActionDialog(true);
      this.props.handleReadingBook(this.props.book);
    });
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
    const actionProps = { left: this.state.left, top: this.state.top };
    return (
      <>
        <div
          className="book-list-item"
          onMouseOver={() => {
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
                <img src="assets/cover.svg" alt="" style={{ width: "80%" }} />
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
                onClick={(event) => {
                  this.handleMoreAction(event);
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
        {this.props.isOpenActionDialog &&
        this.props.book.key === this.props.currentBook.key ? (
          <ActionDialog {...actionProps} />
        ) : null}
      </>
    );
  }
}
export default Book;
