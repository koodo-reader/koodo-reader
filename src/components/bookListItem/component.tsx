import React from "react";
import "./bookListItem.css";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { BookItemProps, BookItemState } from "./interface";
import { Trans } from "react-i18next";
import AddFavorite from "../../utils/readUtils/addFavorite";
import { withRouter } from "react-router-dom";
import RecentBooks from "../../utils/readUtils/recordRecent";
import OtherUtil from "../../utils/otherUtil";
import AddTrash from "../../utils/readUtils/addTrash";
import EmptyCover from "../emptyCover";
import BookUtil from "../../utils/fileUtils/bookUtil";
import FileSaver from "file-saver";
import localforage from "localforage";
import { isElectron } from "react-device-detect";

class BookListItem extends React.Component<BookItemProps, BookItemState> {
  epub: any;
  constructor(props: BookItemProps) {
    super(props);
    this.state = {
      isDeleteDialog: false,
      isFavorite: AddFavorite.getAllFavorite().indexOf(this.props.book.key) > 1,
    };
  }
  componentDidMount() {
    let filePath = "";
    //控制是否自动打开本书
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      filePath = ipcRenderer.sendSync("get-file-data");
    }
    if (
      OtherUtil.getReaderConfig("isOpenBook") === "yes" &&
      RecentBooks.getAllRecent()[0] === this.props.book.key &&
      !this.props.currentBook.key &&
      !filePath
    ) {
      BookUtil.RedirectBook(this.props.book);
    }
    this.props.handleReadingBook(this.props.book);
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
  handleLoveBook = () => {
    AddFavorite.setFavorite(this.props.book.key);
    this.setState({ isFavorite: true });
    this.props.handleMessage("Add Successfully");
    this.props.handleMessageBox(true);
  };
  handleCancelLoveBook = () => {
    AddFavorite.clear(this.props.book.key);
    this.setState({ isFavorite: false });
    this.props.handleMessage("Cancel Successfully");
    this.props.handleMessageBox(true);
  };
  handleResoreBook = () => {
    AddTrash.clear(this.props.currentBook.key);
    this.props.handleMessage("Restore Successfully");
    this.props.handleMessageBox(true);
    this.props.handleFetchBooks();
  };
  handleJump = () => {
    RecentBooks.setRecent(this.props.book.key);
    BookUtil.RedirectBook(this.props.book);
  };
  render() {
    let percentage = RecordLocation.getCfi(this.props.book.key)
      ? RecordLocation.getCfi(this.props.book.key).percentage
      : 0;

    return (
      <div className="book-list-item-container">
        {this.props.book.cover &&
        this.props.book.cover !== "noCover" &&
        this.props.book.publisher !== "mobi" &&
        this.props.book.publisher !== "azw3" &&
        this.props.book.publisher !== "txt" ? (
          <img
            className="book-item-list-cover"
            src={this.props.book.cover}
            alt=""
            onClick={() => {
              this.handleJump();
            }}
          />
        ) : (
          <div
            className="book-item-list-cover"
            onClick={() => {
              this.handleJump();
            }}
          >
            <EmptyCover
              {...{
                format: this.props.book.format,
                title: this.props.book.name,
                scale: 0.54,
              }}
            />
          </div>
        )}
        <p
          className="book-item-list-title"
          onClick={() => {
            this.handleJump();
          }}
        >
          {this.props.book.name}
        </p>

        <p className="book-item-list-author">
          <Trans>
            {this.props.book.author ? this.props.book.author : "Unknown Authur"}
          </Trans>
        </p>
        <p className="book-item-list-percentage">
          {percentage ? Math.round(percentage * 100) : 0}%
        </p>
        {this.props.mode === "trash" ? (
          <div className="book-item-list-config">
            <span
              className="icon-clockwise list-icon"
              onClick={() => {
                this.handleResoreBook();
              }}
            ></span>
          </div>
        ) : (
          <div className="book-item-list-config">
            {this.state.isFavorite ? (
              <span
                className="icon-love list-icon"
                onClick={() => {
                  this.handleCancelLoveBook();
                }}
                style={{ color: "#f87356" }}
              ></span>
            ) : (
              <span
                className="icon-love list-icon"
                onClick={() => {
                  this.handleLoveBook();
                }}
              ></span>
            )}

            <span
              className="icon-shelf list-icon"
              onClick={() => {
                this.handleAddShelf();
              }}
            ></span>
            <span
              className="icon-trash list-icon"
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
            <span
              className="icon-export list-icon"
              onClick={() => {
                localforage
                  .getItem(this.props.currentBook.key)
                  .then((result: any) => {
                    this.props.handleMessage("Export Successfully");
                    this.props.handleMessageBox(true);
                    FileSaver.saveAs(
                      new Blob([result]),
                      this.props.currentBook.name +
                        `.${this.props.currentBook.format.toLocaleLowerCase()}`
                    );
                  });
              }}
            ></span>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(BookListItem);
