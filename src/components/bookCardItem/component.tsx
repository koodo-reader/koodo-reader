import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import "./bookCardItem.css";
import { BookCardProps, BookCardState } from "./interface";
import AddFavorite from "../../utils/readUtils/addFavorite";
import ActionDialog from "../dialogs/actionDialog";
import OtherUtil from "../../utils/otherUtil";
import { withRouter } from "react-router-dom";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { isElectron } from "react-device-detect";
import EmptyCover from "../emptyCover";
import BookUtil from "../../utils/fileUtils/bookUtil";
import toast from "react-hot-toast";

declare var window: any;

class BookCardItem extends React.Component<BookCardProps, BookCardState> {
  epub: any;
  constructor(props: BookCardProps) {
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

  handleMoreAction = (event: any) => {
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300) {
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
    if (Object.keys(AddFavorite.getAllFavorite()).length === 0) {
      this.props.history.push("/manager/empty");
    }
    toast.success(this.props.t("Cancel Successfully"));
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
          className="book-list-item"
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
              className="book-item-cover"
              src={this.props.book.cover}
              alt=""
              onClick={() => {
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
                this.handleJump();
              }}
            />
          ) : (
            <div
              className="book-item-cover"
              onClick={() => {
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
                this.handleJump();
              }}
            >
              <EmptyCover
                {...{
                  format: this.props.book.format,
                  title: this.props.book.name,
                  scale: 1,
                }}
              />
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
          {this.props.isSelectBook && this.props.isSelected ? (
            <span className="icon-message book-selected-icon"></span>
          ) : null}

          {this.state.isOpenConfig && !this.props.isSelectBook ? (
            <>
              {this.props.book.format !== "PDF" && (
                <div className="reading-progress-icon">
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
          <div className="action-dialog-parent">
            <ActionDialog {...actionProps} />
          </div>
        ) : null}
      </>
    );
  }
}
export default withRouter(BookCardItem);
