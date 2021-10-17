import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import "./bookCoverItem.css";
import { BookCoverProps, BookCoverState } from "./interface";
import AddFavorite from "../../utils/readUtils/addFavorite";
import ActionDialog from "../dialogs/actionDialog";
import OtherUtil from "../../utils/otherUtil";
import { withRouter } from "react-router-dom";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { isElectron } from "react-device-detect";
import EmptyCover from "../emptyCover";
import Parser from "html-react-parser";
import { Trans } from "react-i18next";
import BookUtil from "../../utils/fileUtils/bookUtil";
import toast from "react-hot-toast";
declare var window: any;

class BookCoverItem extends React.Component<BookCoverProps, BookCoverState> {
  epub: any;
  constructor(props: BookCoverProps) {
    super(props);
    this.state = {
      isOpenConfig: false,
      isFavorite:
        AddFavorite.getAllFavorite().indexOf(this.props.book.key) > -1,
      left: 0,
      top: 0,
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
      this.props.handleReadingBook(this.props.book);
      if (OtherUtil.getReaderConfig("isOpenInMain") === "yes") {
        this.props.history.push(BookUtil.getBookUrl(this.props.book));
      } else {
        BookUtil.RedirectBook(this.props.book);
      }
    }
  }

  handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300 && !this.props.isCollapsed) {
      x = x - 180;
    }
    this.setState(
      {
        left: x,
        top:
          document.body.clientHeight - e.clientY > 300
            ? e.clientY
            : e.clientY - 300,
      },
      () => {
        this.props.handleActionDialog(true);
        this.props.handleReadingBook(this.props.book);
      }
    );
  };
  handleDeleteBook = () => {
    this.props.handleReadingBook(this.props.book);
    this.props.handleDeleteDialog(true);
    this.props.handleActionDialog(false);
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
  //控制按钮的弹出
  handleConfig = (mode: boolean) => {
    this.setState({ isOpenConfig: mode });
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
    if (OtherUtil.getReaderConfig("isOpenInMain") === "yes") {
      this.props.history.push(BookUtil.getBookUrl(this.props.book));
    } else {
      BookUtil.RedirectBook(this.props.book);
    }
  };
  render() {
    let percentage = RecordLocation.getCfi(this.props.book.key)
      ? RecordLocation.getCfi(this.props.book.key).percentage
      : 0;
    const actionProps = { left: this.state.left, top: this.state.top };
    return (
      <>
        <div
          className="book-list-cover-item"
          onMouseOver={() => {
            this.handleConfig(true);
          }}
          onMouseLeave={() => {
            this.handleConfig(false);
          }}
          onContextMenu={(event) => {
            this.handleMoreAction(event);
          }}
        >
          {this.props.book.cover &&
          this.props.book.cover !== "noCover" &&
          this.props.book.publisher !== "mobi" &&
          this.props.book.publisher !== "azw3" &&
          this.props.book.publisher !== "txt" ? (
            <img
              className="book-cover-item-cover"
              src={this.props.book.cover}
              alt=""
              onClick={() => {
                this.handleJump();
              }}
            />
          ) : (
            <div
              className="book-cover-item-cover"
              onClick={() => {
                this.handleJump();
              }}
            >
              <EmptyCover
                {...{
                  format: this.props.book.format,
                  title: this.props.book.name,
                  scale: 1.15,
                }}
              />
            </div>
          )}

          <p className="book-cover-item-title">{this.props.book.name}</p>
          <p className="book-cover-item-author">
            <Trans>Author</Trans>:&nbsp;
            <Trans>{this.props.book.author}</Trans>
          </p>
          <p className="book-cover-item-author">
            <Trans>Publisher</Trans>:&nbsp;
            <Trans>{this.props.book.publisher}</Trans>
          </p>
          <div className="book-cover-item-desc">
            <Trans>Description</Trans>:&nbsp;
            {this.props.book.description ? (
              Parser(this.props.book.description)
            ) : (
              <Trans>Empty</Trans>
            )}
          </div>
          {this.state.isFavorite && !this.props.isSelectBook ? (
            <span
              className="icon-love book-loved-icon"
              onClick={() => {
                this.handleCancelLoveBook();
              }}
              style={{ right: "274px", bottom: "25px" }}
            ></span>
          ) : null}
          {this.props.isSelectBook && this.props.isSelected ? (
            <span
              className="icon-message book-selected-icon"
              style={{ right: "274px", bottom: "25px" }}
            ></span>
          ) : null}
          {this.state.isOpenConfig && !this.props.isSelectBook ? (
            <>
              {this.props.book.format !== "PDF" && (
                <div
                  className="reading-progress-icon"
                  style={{ right: "270px" }}
                >
                  <div style={{ position: "relative", left: "4px" }}>
                    {percentage
                      ? Math.floor(percentage * 100) < 10
                        ? "0" + Math.floor(percentage * 100)
                        : Math.floor(percentage * 100) === 100
                        ? "完"
                        : Math.floor(percentage * 100)
                      : "00"}
                    <span className="reading-percentage-char">%</span>
                  </div>
                </div>
              )}
              <span
                className="icon-more book-more-action"
                onClick={(event) => {
                  this.handleMoreAction(event);
                }}
                style={{ right: "270px" }}
              ></span>
              <span
                className="icon-love book-love-icon"
                onClick={() => {
                  this.handleLoveBook();
                }}
                style={{ right: "275px", bottom: "25px" }}
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
export default withRouter(BookCoverItem);
