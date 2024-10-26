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
import ActionDialog from "../dialogs/actionDialog";
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
      left: 0,
      top: 0,
      isHover: false,
    };
  }
  componentDidMount() {
    let filePath = "";
    //open book when app start
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
    toast.success(this.props.t("Addition successful"));
  };
  handleRestoreBook = () => {
    AddTrash.clear(this.props.book.key);
    toast.success(this.props.t("Restore successful"));
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
        toast.success(this.props.t("Export successful"));
        window.saveAs(
          new Blob([result]),
          this.props.book.name +
            `.${this.props.book.format.toLocaleLowerCase()}`
        );
      }
    );
  }
  handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300) {
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
  render() {
    const actionProps = { left: this.state.left, top: this.state.top };

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
      <>
        <div
          className="book-list-item-container"
          onContextMenu={(event) => {
            this.handleMoreAction(event);
          }}
        >
          {!this.props.book.cover ||
          this.props.book.cover === "noCover" ||
          (this.props.book.format === "PDF" &&
            StorageUtil.getReaderConfig("isDisablePDFCover") === "yes") ? (
            <div
              className="book-item-list-cover"
              onClick={() => {
                this.handleJump();
              }}
              style={{ height: "65px" }}
              onMouseEnter={() => {
                this.setState({ isHover: true });
              }}
              onMouseLeave={() => {
                this.setState({ isHover: false });
              }}
            >
              <div className="book-item-image" style={{ height: "65px" }}>
                <EmptyCover
                  {...{
                    format: this.props.book.format,
                    title: this.props.book.name,
                    scale: 0.43,
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              className="book-item-list-cover"
              onClick={() => {
                this.handleJump();
              }}
              onMouseEnter={() => {
                this.setState({ isHover: true });
              }}
              onMouseLeave={() => {
                this.setState({ isHover: false });
              }}
            >
              <img
                data-src={this.props.book.cover}
                alt=""
                className="lazy-image book-item-image"
                style={{ width: "100%" }}
                onLoad={(res: any) => {
                  if (
                    res.target.naturalHeight / res.target.naturalWidth >
                    74 / 47
                  ) {
                    this.setState({ direction: "horizontal" });
                  } else {
                    this.setState({ direction: "vertical" });
                  }
                }}
              />
            </div>
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
                  ? { left: "18px", bottom: "5px", opacity: 1 }
                  : { left: "18px", bottom: "5px", color: "#eee" }
              }
            ></span>
          ) : null}
          <p
            className="book-item-list-title"
            onClick={() => {
              this.handleJump();
            }}
          >
            <div className="book-item-list-subtitle">
              <div className="book-item-list-subtitle-text">
                {this.props.book.name}
              </div>
            </div>

            <p className="book-item-list-percentage">
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
            </p>
            <div className="book-item-list-author">
              <Trans>
                {this.props.book.author
                  ? this.props.book.author
                  : "Unknown author"}
              </Trans>
            </div>
          </p>
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

export default withRouter(BookListItem as any);
