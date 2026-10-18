import React from "react";
import "./collectionDetailDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import BookCardItem from "../../bookCardItem";
import { ConfigService, CollectionUtil } from "../../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../../utils/storage/databaseService";
import BookModel from "../../../models/Book";
import {
  CollectionDetailDialogProps,
  CollectionDetailDialogState,
} from "./interface";

const collectionUtil = new CollectionUtil(ConfigService);

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
    let collection = collectionUtil.getCollection(
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
    collectionUtil.removeBooksFromCollection(this.props.currentCollectionKey, [
      book.key,
    ]);
    toast.success(this.props.t("Modification successful"));
    this.loadBooks();
    this.props.handleFetchBooks();
  };

  render() {
    let collection = collectionUtil.getCollection(
      this.props.currentCollectionKey
    );
    if (!collection) {
      return null;
    }
    return (
      <div className="collection-detail-dialog-container">
        <div
          className="collection-detail-dialog-close-container"
          onClick={() => {
            this.handleCancel();
          }}
        >
          <span className="icon-close collection-detail-dialog-close"></span>
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
