import React from "react";
import "./collectionDetailDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import ActionDialog from "../actionDialog";
import EmptyCover from "../../emptyCover";
import CollectionCover from "../../collectionCover";
import CollectionUtil from "../../../utils/file/collectionUtil";
import DatabaseService from "../../../utils/storage/databaseService";
import CoverUtil from "../../../utils/file/coverUtil";
import BookUtil from "../../../utils/file/bookUtil";
import BookModel from "../../../models/Book";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  CollectionDetailDialogProps,
  CollectionDetailDialogState,
  LoadedBookItem,
} from "./interface";
import {
  clampMenuPosition,
  estimateMenuHeight,
  CONTEXT_MENU_WIDTH,
} from "../../../utils/common";

class CollectionDetailDialog extends React.Component<
  CollectionDetailDialogProps,
  CollectionDetailDialogState
> {
  constructor(props: CollectionDetailDialogProps) {
    super(props);
    this.state = { books: [], left: 0, top: 0 };
  }

  componentDidMount() {
    this.loadBooks();
  }

  componentDidUpdate(prevProps: CollectionDetailDialogProps) {
    if (prevProps.currentCollectionKey !== this.props.currentCollectionKey) {
      this.loadBooks();
    }
  }

  loadBooks = async () => {
    let collection = CollectionUtil.getCollection(
      this.props.currentCollectionKey
    );
    if (!collection) {
      this.setState({ books: [] });
      return;
    }
    let books: LoadedBookItem[] = [];
    let keys = [...collection.books].reverse();
    for (let i = 0; i < keys.length; i++) {
      let book = await DatabaseService.getRecord(keys[i], "books");
      if (!book) continue;
      let isCoverExist = await CoverUtil.isCoverExist(book);
      let cover = isCoverExist ? await CoverUtil.getCover(book) : "";
      if (
        cover &&
        !cover.startsWith("data:") &&
        !cover.startsWith("blob:") &&
        !cover.startsWith("http")
      ) {
        cover = cover + "?t=" + Date.now();
      }
      let location = ConfigService.getObjectConfig(
        book.key,
        "recordLocation",
        {}
      );
      books.push({
        book,
        cover: cover || "",
        isCoverExist,
        percentage: location?.percentage || "0",
      });
    }
    this.setState({ books });
  };

  handleCancel = () => {
    this.props.handleCollectionDetailDialog(false);
    this.props.handleActionDialog(false);
  };

  handleOpenBook = (book: BookModel) => {
    ConfigService.setListConfig(this.props.currentCollectionKey, "recentBooks");
    this.props.handleReadingBook(book);
    BookUtil.redirectBook(book);
    this.props.handleCollectionDetailDialog(false);
    this.props.handleActionDialog(false);
  };

  handleRemoveBook = (event: React.MouseEvent, book: BookModel) => {
    event.stopPropagation();
    CollectionUtil.removeBooksFromCollection(this.props.currentCollectionKey, [
      book.key,
    ]);
    toast.success(this.props.t("Modification successful"));
    this.loadBooks();
    this.props.handleFetchBooks();
  };

  handleMoreAction = (event: React.MouseEvent, book: BookModel) => {
    event.preventDefault();
    let x = event.clientX;
    if (x > document.body.clientWidth - 300) {
      x = x - 190;
    } else {
      x = x - 10;
    }
    let y =
      document.body.clientHeight - event.clientY > 250
        ? event.clientY - 10
        : event.clientY - 240;
    let pos = clampMenuPosition(
      x,
      y,
      CONTEXT_MENU_WIDTH,
      estimateMenuHeight(10)
    );
    this.setState({ left: pos.left, top: pos.top });
    this.props.handleReadingBook(book);
    this.props.handleActionDialog(true);
  };

  renderPercentage(percentage: string) {
    return (
      <>
        {percentage && !isNaN(parseFloat(percentage))
          ? percentage === "0"
            ? "New"
            : percentage === "1"
              ? "Done"
              : (parseFloat(percentage) * 100).toFixed(2)
          : "0"}
        {percentage &&
          !isNaN(parseFloat(percentage)) &&
          percentage !== "0" &&
          percentage !== "1" && <span>%</span>}
      </>
    );
  }

  render() {
    let collection = CollectionUtil.getCollection(
      this.props.currentCollectionKey
    );
    if (!collection) {
      return null;
    }
    return (
      <div className="collection-detail-dialog-container">
        <div className="collection-detail-dialog-header">
          <CollectionCover
            bookKeys={collection.books}
            refreshBookKey={this.props.refreshBookKey}
            width={60}
            height={78}
          />
          <div className="collection-detail-dialog-info">
            <p className="collection-detail-dialog-name">{collection.name}</p>
            <p className="collection-detail-dialog-count">
              <Trans i18nKey="Total books" count={collection.books.length}>
                {"Total " + collection.books.length + " books"}
              </Trans>
            </p>
          </div>
          <span
            className="icon-close collection-detail-dialog-close"
            onClick={() => {
              this.handleCancel();
            }}
          ></span>
        </div>
        <div className="collection-detail-dialog-body">
          {this.state.books.length === 0 ? (
            <div className="collection-detail-dialog-empty">
              <span className="icon-folder collection-detail-dialog-empty-icon"></span>
              <p>
                <Trans>Empty</Trans>
              </p>
            </div>
          ) : (
            this.state.books.map((item) => {
              return (
                <div
                  className="collection-detail-book-item"
                  key={item.book.key}
                  onClick={() => {
                    this.handleOpenBook(item.book);
                  }}
                  onContextMenu={(event) => {
                    this.handleMoreAction(event, item.book);
                  }}
                >
                  <div className="collection-detail-book-cover">
                    {item.isCoverExist && item.cover ? (
                      <img src={item.cover} alt="" draggable={false}></img>
                    ) : (
                      <div className="collection-detail-book-empty-cover">
                        <EmptyCover
                          {...{
                            format: item.book.format,
                            title: item.book.name,
                            scale: 0.75,
                          }}
                        />
                      </div>
                    )}
                    <span
                      className="icon-close collection-detail-book-remove"
                      title={this.props.t("Remove from collection")}
                      onClick={(event) => {
                        this.handleRemoveBook(event, item.book);
                      }}
                    ></span>
                  </div>
                  <p className="collection-detail-book-title">
                    {item.book.name}
                  </p>
                  <p className="collection-detail-book-percentage">
                    {this.renderPercentage(item.percentage)}
                  </p>
                </div>
              );
            })
          )}
        </div>
        {this.props.isOpenActionDialog &&
        this.props.currentBook &&
        this.props.currentBook.key !== this.props.currentCollectionKey ? (
          <ActionDialog
            {...({ left: this.state.left, top: this.state.top } as any)}
          />
        ) : null}
      </div>
    );
  }
}

export default CollectionDetailDialog;
