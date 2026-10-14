import React from "react";
import "./collectionDetailDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import BookCardItem from "../../bookCardItem";
import CollectionCover from "../../collectionCover";
import CollectionUtil from "../../../utils/file/collectionUtil";
import DatabaseService from "../../../utils/storage/databaseService";
import BookModel from "../../../models/Book";
import {
  CollectionDetailDialogProps,
  CollectionDetailDialogState,
} from "./interface";

class CollectionDetailDialog extends React.Component<
  CollectionDetailDialogProps,
  CollectionDetailDialogState
> {
  constructor(props: CollectionDetailDialogProps) {
    super(props);
    this.state = { books: [] };
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
    let books: BookModel[] = [];
    let keys = [...collection.books].reverse();
    for (let i = 0; i < keys.length; i++) {
      let book = await DatabaseService.getRecord(keys[i], "books");
      if (book) {
        books.push(book);
      }
    }
    this.setState({ books });
  };

  handleCancel = () => {
    this.props.handleCollectionDetailDialog(false);
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
            this.state.books.map((book) => {
              return (
                <div className="collection-detail-book-wrapper" key={book.key}>
                  <BookCardItem
                    {...({
                      book,
                      cardScale: 1,
                      isSelected: false,
                    } as any)}
                  />
                  <span
                    className="icon-close collection-detail-book-remove"
                    title={this.props.t("Remove from collection")}
                    onClick={(event) => {
                      this.handleRemoveBook(event, book);
                    }}
                  ></span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
}

export default CollectionDetailDialog;
