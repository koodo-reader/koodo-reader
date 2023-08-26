import React from "react";
import "./bookListItem.css";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { BookItemProps, BookItemState } from "./interface";
import { Trans } from "react-i18next";
import AddFavorite from "../../utils/readUtils/addFavorite";
import { withRouter } from "react-router-dom";
import RecentBooks from "../../utils/readUtils/recordRecent";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import AddTrash from "../../utils/readUtils/addTrash";
import EmptyCover from "../emptyCover";
import BookUtil from "../../utils/fileUtils/bookUtil";

import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
declare var window: any;
class BookListItem extends React.Component<BookItemProps, BookItemState> {
  constructor(props: BookItemProps) {
    super(props);
    this.state = {
      isDeleteDialog: false,
      isFavorite:
        AddFavorite.getAllFavorite().indexOf(this.props.book.key) > -1,
      direction: "horizontal",
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
      StorageUtil.getReaderConfig("isOpenBook") === "yes" &&
      RecentBooks.getAllRecent()[0] === this.props.book.key &&
      !this.props.currentBook.key &&
      !filePath
    ) {
      this.props.handleReadingBook(this.props.book);
      BookUtil.RedirectBook(this.props.book, this.props.t, this.props.history);
    }
  }
  UNSAFE_componentWillReceiveProps(nextProps: BookItemProps) {
    if (nextProps.book.key !== this.props.book.key) {
      this.setState({
        isFavorite:
          AddFavorite.getAllFavorite().indexOf(nextProps.book.key) > -1,
      });
    }
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
    toast.success(this.props.t("Add Successfully"));
  };
  handleCancelLoveBook = () => {
    AddFavorite.clear(this.props.book.key);
    this.setState({ isFavorite: false });
    toast.success(this.props.t("Cancel Successfully"));
  };
  handleRestoreBook = () => {
    AddTrash.clear(this.props.book.key);
    toast.success(this.props.t("Restore Successfully"));
    this.props.handleFetchBooks();
  };
  handleJump = () => {
    if (this.props.isSelectBook) {
      this.props.handleSelectedBooks(
        this.props.isSelected
          ? this.props.selectedBooks.filter(
              (item) => item !== this.props.book.key
            )
          : [...this.props.selectedBooks, this.props.book.key]
      );
      return;
    }
    RecentBooks.setRecent(this.props.book.key);
    this.props.handleReadingBook(this.props.book);
    BookUtil.RedirectBook(this.props.book, this.props.t, this.props.history);
  };
  handleExportBook() {
    BookUtil.fetchBook(this.props.book.key, true, this.props.book.path).then(
      (result: any) => {
        toast.success(this.props.t("Export Successfully"));
        window.saveAs(
          new Blob([result]),
          this.props.book.name +
            `.${this.props.book.format.toLocaleLowerCase()}`
        );
      }
    );
  }
  render() {
    let percentage = "0";
    if (this.props.book.format === "PDF") {
      if (
        RecordLocation.getPDFLocation(this.props.book.md5.split("-")[0]) &&
        RecordLocation.getPDFLocation(this.props.book.md5.split("-")[0]).page &&
        this.props.book.page
      ) {
        percentage =
          RecordLocation.getPDFLocation(this.props.book.md5.split("-")[0])
            .page /
            this.props.book.page +
          "";
      }
    } else {
      if (
        RecordLocation.getHtmlLocation(this.props.book.key) &&
        RecordLocation.getHtmlLocation(this.props.book.key).percentage
      ) {
        percentage = RecordLocation.getHtmlLocation(
          this.props.book.key
        ).percentage;
      }
    }
    return (
      <div className="book-list-item-container">
        {!this.props.book.cover ||
        this.props.book.cover === "noCover" ||
        (this.props.book.format === "PDF" &&
          StorageUtil.getReaderConfig("isDisablePDFCover") === "yes") ? (
          <div
            className="book-item-list-cover"
            onClick={() => {
              this.handleJump();
            }}
            style={{ display: "block" }}
          >
            <EmptyCover
              {...{
                format: this.props.book.format,
                title: this.props.book.name,
                scale: 0.54,
              }}
            />
          </div>
        ) : (
          <div
            className="book-item-list-cover"
            onClick={() => {
              this.handleJump();
            }}
          >
            <img
              src={this.props.book.cover}
              alt=""
              style={
                this.state.direction === "horizontal"
                  ? { width: "100%" }
                  : { height: "100%" }
              }
              onLoad={(res: any) => {
                if (
                  res.target.naturalHeight / res.target.naturalWidth >
                  74 / 57
                ) {
                  this.setState({ direction: "horizontal" });
                } else {
                  this.setState({ direction: "vertical" });
                }
              }}
            />
          </div>
        )}
        {this.props.isSelectBook ? (
          <span
            className="icon-message book-selected-icon"
            style={
              this.props.isSelected
                ? { left: "35px", bottom: "5px" }
                : { left: "35px", bottom: "5px", color: "#eee" }
            }
          ></span>
        ) : null}
        <p
          className="book-item-list-title"
          onClick={() => {
            this.handleJump();
          }}
        >
          <span className="book-item-list-subtitle">
            {this.props.book.name}
          </span>
        </p>

        <p className="book-item-list-author">
          <span className="book-item-list-subtitle">
            <Trans>
              {this.props.book.author
                ? this.props.book.author
                : "Unknown Author"}
            </Trans>
          </span>
        </p>
        <p className="book-item-list-percentage">
          {percentage
            ? Math.floor(parseFloat(percentage) * 100) === 0
              ? "New"
              : Math.floor(parseFloat(percentage) * 100) < 10
              ? "0" + Math.floor(parseFloat(percentage) * 100)
              : Math.floor(parseFloat(percentage) * 100) === 100
              ? "Done"
              : Math.floor(parseFloat(percentage) * 100)
            : "00"}
          {Math.floor(parseFloat(percentage) * 100) > 0 &&
            Math.floor(parseFloat(percentage) * 100) < 100 && (
              <span className="reading-percentage-char">%</span>
            )}
        </p>
        {this.props.mode === "trash" ? (
          <div className="book-item-list-config">
            <span
              className="icon-clockwise list-icon"
              onClick={() => {
                this.handleRestoreBook();
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
                this.handleExportBook();
              }}
            ></span>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(BookListItem as any);
