//卡片模式下的图书显示
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
import BookUtil from "../../utils/bookUtil";

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
      BookUtil.RedirectBook(this.props.book);
    }
    this.props.handleReadingBook(this.props.book);
  }
  componentWillReceiveProps(nextProps: BookCoverProps) {
    if (nextProps.isDragToLove !== this.props.isDragToLove) {
      if (
        nextProps.isDragToLove &&
        this.props.dragItem === this.props.book.key
      ) {
        this.handleLoveBook();
        this.props.handleDragToLove(false);
      }
    }
    if (nextProps.isDragToDelete !== this.props.isDragToDelete) {
      if (
        nextProps.isDragToDelete &&
        this.props.dragItem === this.props.book.key
      ) {
        this.handleDeleteBook();
        this.props.handleDragToDelete(false);
      }
    }
  }
  handleMoreAction = (event: any) => {
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300 && !this.props.isCollapsed) {
      x = x - 180;
    }
    this.setState(
      {
        left: this.props.isCollapsed ? x - 80 : x - 200,
        top:
          document.body.clientHeight - e.clientY > 260
            ? document.body.clientHeight - 420 - e.clientY
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
    this.props.handleMessage("Add Successfully");
    this.props.handleMessageBox(true);
  };
  handleCancelLoveBook = () => {
    AddFavorite.clear(this.props.book.key);
    this.setState({ isFavorite: false });
    this.props.handleMessage("Cancel Successfully");
    this.props.handleMessageBox(true);
  };
  //控制按钮的弹出
  handleConfig = (mode: boolean) => {
    this.setState({ isOpenConfig: mode });
  };
  handleJump = () => {
    RecentBooks.setRecent(this.props.book.key);

    BookUtil.RedirectBook(this.props.book);
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
              onDragStart={() => {
                this.props.handleDragItem(this.props.book.key);
              }}
              onDragEnd={() => {
                this.props.handleDragItem("");
              }}
            />
          ) : (
            <div
              className="book-cover-item-cover"
              onClick={() => {
                this.handleJump();
              }}
              onDragStart={() => {
                this.props.handleDragItem(this.props.book.key);
              }}
              onDragEnd={() => {
                this.props.handleDragItem("");
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
          {this.state.isFavorite ? (
            <span
              className="icon-love book-loved-icon"
              onClick={() => {
                this.handleCancelLoveBook();
              }}
              style={{ right: "274px", bottom: "25px" }}
            ></span>
          ) : null}

          {this.state.isOpenConfig ? (
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
