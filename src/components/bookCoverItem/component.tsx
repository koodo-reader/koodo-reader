import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import "./bookCoverItem.css";
import { BookCoverProps, BookCoverState } from "./interface";
import AddFavorite from "../../utils/readUtils/addFavorite";
import ActionDialog from "../dialogs/actionDialog";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import { withRouter } from "react-router-dom";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { isElectron } from "react-device-detect";
import EmptyCover from "../emptyCover";
import { Trans } from "react-i18next";
import BookUtil from "../../utils/fileUtils/bookUtil";
import toast from "react-hot-toast";
declare var window: any;

class BookCoverItem extends React.Component<BookCoverProps, BookCoverState> {
  constructor(props: BookCoverProps) {
    super(props);
    this.state = {
      isFavorite:
        AddFavorite.getAllFavorite().indexOf(this.props.book.key) > -1,
      left: 0,
      top: 0,
      direction: "horizontal",
      desc: "",
      isHover: false,
    };
  }

  componentDidMount() {
    let filePath = "";
    // Get file path from electron
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
  UNSAFE_componentWillReceiveProps(nextProps: BookCoverProps) {
    if (nextProps.book.key !== this.props.book.key) {
      this.setState({
        isFavorite:
          AddFavorite.getAllFavorite().indexOf(nextProps.book.key) > -1,
      });
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
          document.body.clientHeight - e.clientY > 250
            ? e.clientY
            : e.clientY - 200,
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
    toast.success(this.props.t("Addition successful"));
  };
  handleCancelLoveBook = () => {
    AddFavorite.clear(this.props.book.key);
    this.setState({ isFavorite: false });
    if (
      Object.keys(AddFavorite.getAllFavorite()).length === 0 &&
      this.props.mode === "favorite"
    ) {
      this.props.history.push("/manager/empty");
    }
    toast.success(this.props.t("Cancellation successful"));
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
    var htmlString = this.props.book.description;
    var div = document.createElement("div");
    div.innerHTML = htmlString;
    var textContent = div.textContent || div.innerText;
    const actionProps = { left: this.state.left, top: this.state.top };
    return (
      <>
        <div
          className="book-list-cover-item"
          onContextMenu={(event) => {
            this.handleMoreAction(event);
          }}
        >
          <div className="book-cover-item-header">
            <div className="reading-progress-icon">
              <div style={{ position: "relative", left: "4px" }}>
                {percentage
                  ? Math.floor(parseFloat(percentage) * 100) === 0
                    ? "New"
                    : Math.floor(parseFloat(percentage) * 100) < 10
                    ? Math.floor(parseFloat(percentage) * 100)
                    : Math.floor(parseFloat(percentage) * 100) === 100
                    ? "Done"
                    : Math.floor(parseFloat(percentage) * 100)
                  : "0"}
                {Math.floor(parseFloat(percentage) * 100) > 0 &&
                  Math.floor(parseFloat(percentage) * 100) < 100 && (
                    <span>%</span>
                  )}
              </div>
            </div>
            <span
              className="icon-more book-more-action"
              onClick={(event) => {
                this.handleMoreAction(event);
              }}
            ></span>
          </div>

          <div
            className="book-cover-item-cover"
            onClick={() => {
              this.handleJump();
            }}
            onMouseEnter={() => {
              this.setState({ isHover: true });
            }}
            onMouseLeave={() => {
              this.setState({ isHover: false });
            }}
            style={
              StorageUtil.getReaderConfig("isDisableCrop") === "yes"
                ? {
                    height: "195px",
                    alignItems: "flex-start",
                    background: "rgba(255, 255,255, 0)",
                    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0)",
                  }
                : {
                    height: "170px",
                    alignItems: "center",
                    overflow: "hidden",
                  }
            }
          >
            {!this.props.book.cover ||
            this.props.book.cover === "noCover" ||
            (this.props.book.format === "PDF" &&
              StorageUtil.getReaderConfig("isDisablePDFCover") === "yes") ? (
              <div
                className="book-item-image"
                style={{ width: "120px", height: "170px" }}
              >
                <EmptyCover
                  {...{
                    format: this.props.book.format,
                    title: this.props.book.name,
                    scale: 1.14,
                  }}
                />
              </div>
            ) : (
              <img
                data-src={this.props.book.cover}
                alt=""
                style={
                  this.state.direction === "horizontal" ||
                  StorageUtil.getReaderConfig("isDisableCrop") === "yes"
                    ? { width: "100%" }
                    : { height: "100%" }
                }
                className="lazy-image book-item-image"
                onLoad={(res: any) => {
                  if (
                    res.target.naturalHeight / res.target.naturalWidth >
                    170 / 120
                  ) {
                    this.setState({ direction: "horizontal" });
                  } else {
                    this.setState({ direction: "vertical" });
                  }
                }}
              />
            )}
            {this.props.isSelectBook || this.state.isHover ? (
              <span
                className="icon-message book-selected-icon"
                onMouseEnter={() => {
                  this.setState({ isHover: true });
                }}
                onClick={(event) => {
                  if (this.props.isSelectBook) {
                    this.props.handleSelectedBooks(
                      this.props.isSelected
                        ? this.props.selectedBooks.filter(
                            (item) => item !== this.props.book.key
                          )
                        : [...this.props.selectedBooks, this.props.book.key]
                    );
                  } else {
                    this.props.handleSelectBook(true);
                    this.props.handleSelectedBooks([this.props.book.key]);
                  }
                  this.setState({ isHover: false });
                  event?.stopPropagation();
                }}
                style={
                  this.props.isSelected
                    ? {
                        right: "272px",
                        top: "30px",
                        opacity: 1,
                      }
                    : {
                        right: "272px",
                        top: "30px",
                        color: "#eee",
                      }
                }
              ></span>
            ) : null}
          </div>

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
            <div className="book-cover-item-desc-detail">
              {this.props.book.description ? textContent : <Trans>Empty</Trans>}
            </div>
          </div>
        </div>
        {this.props.isOpenActionDialog &&
        this.props.book.key === this.props.currentBook.key ? (
          <ActionDialog {...actionProps} />
        ) : null}
      </>
    );
  }
}
export default withRouter(BookCoverItem as any);
