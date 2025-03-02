import React from "react";
import "./bookCardItem.css";
import { BookCardProps, BookCardState } from "./interface";
import ActionDialog from "../dialogs/actionDialog";
import { withRouter } from "react-router-dom";
import { isElectron } from "react-device-detect";
import EmptyCover from "../emptyCover";
import BookUtil from "../../utils/file/bookUtil";
import CoverUtil from "../../utils/file/coverUtil";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

declare var window: any;

class BookCardItem extends React.Component<BookCardProps, BookCardState> {
  constructor(props: BookCardProps) {
    super(props);
    this.state = {
      isFavorite:
        ConfigService.getAllListConfig("favoriteBooks").indexOf(
          this.props.book.key
        ) > -1,
      left: 0,
      top: 0,
      direction: "horizontal",
      isHover: false,
    };
  }

  componentDidMount() {
    let filePath = "";
    //open book when app start
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      filePath = ipcRenderer.sendSync("check-file-data");
    }

    if (
      ConfigService.getReaderConfig("isOpenBook") === "yes" &&
      ConfigService.getAllListConfig("recentBooks")[0] ===
        this.props.book.key &&
      !this.props.currentBook.key &&
      !filePath
    ) {
      this.props.handleReadingBook(this.props.book);

      BookUtil.redirectBook(this.props.book);
    }
  }
  UNSAFE_componentWillReceiveProps(nextProps: BookCardProps) {
    if (nextProps.book.key !== this.props.book.key) {
      this.setState({
        isFavorite:
          ConfigService.getAllListConfig("favoriteBooks").indexOf(
            nextProps.book.key
          ) > -1,
      });
    }
  }

  handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300) {
      x = x - 190;
    } else {
      x = x - 10;
    }
    this.setState(
      {
        left: x,
        top:
          document.body.clientHeight - e.clientY > 250
            ? e.clientY - 10
            : e.clientY - 220,
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
    ConfigService.setListConfig(this.props.book.key, "recentBooks");
    this.props.handleReadingBook(this.props.book);

    BookUtil.redirectBook(this.props.book);
  };
  render() {
    let percentage = "0";
    if (
      ConfigService.getObjectConfig(
        this.props.book.key,
        "recordLocation",
        {}
      ) &&
      ConfigService.getObjectConfig(this.props.book.key, "recordLocation", {})
        .percentage
    ) {
      percentage = ConfigService.getObjectConfig(
        this.props.book.key,
        "recordLocation",
        {}
      ).percentage;
    }

    // let percentage = 0;
    const actionProps = { left: this.state.left, top: this.state.top };
    return (
      <>
        <div
          className="book-list-item"
          onContextMenu={(event) => {
            this.handleMoreAction(event);
          }}
        >
          <div
            className="book-item-cover"
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
              ConfigService.getReaderConfig("isDisableCrop") === "yes"
                ? {
                    height: "168px",
                    alignItems: "flex-end",
                    background: "rgba(255, 255,255, 0)",
                    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0)",
                  }
                : {
                    height: "137px",
                    alignItems: "center",
                    overflow: "hidden",
                  }
            }
          >
            {!CoverUtil.isCoverExist(this.props.book) ||
            (this.props.book.format === "PDF" &&
              ConfigService.getReaderConfig("isDisablePDFCover") === "yes") ? (
              <div className="book-item-image">
                <EmptyCover
                  {...{
                    format: this.props.book.format,
                    title: this.props.book.name,
                    scale: 1,
                  }}
                />
              </div>
            ) : (
              <img
                src={CoverUtil.getCover(this.props.book)}
                alt=""
                className="book-item-image"
                style={
                  this.state.direction === "horizontal" ||
                  ConfigService.getReaderConfig("isDisableCrop") === "yes"
                    ? { width: "100%" }
                    : { height: "100%" }
                }
                onLoad={(res: any) => {
                  if (
                    res.target.naturalHeight / res.target.naturalWidth >
                    137 / 105
                  ) {
                    this.setState({ direction: "horizontal" });
                  } else {
                    this.setState({ direction: "vertical" });
                  }
                }}
              ></img>
            )}
          </div>
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
                  ? { opacity: 1 }
                  : {
                      color: "#eee",
                    }
              }
            ></span>
          ) : null}

          <p className="book-item-title">{this.props.book.name}</p>
          <div className="reading-progress-icon">
            <div style={{ position: "relative", left: "4px" }}>
              {percentage && !isNaN(parseFloat(percentage))
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
          {ConfigService.getAllListConfig("favoriteBooks").indexOf(
            this.props.book.key
          ) > -1 && <span className="icon-heart book-heart-action"></span>}
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
export default withRouter(BookCardItem as any);
