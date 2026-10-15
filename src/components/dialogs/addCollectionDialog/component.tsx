import React, { Component } from "react";
import { Trans } from "react-i18next";
import {
  AddCollectionDialogProps,
  AddCollectionDialogState,
} from "./interface";
import "./addCollectionDialog.css";
import toast from "react-hot-toast";
import CollectionUtil from "../../../utils/file/collectionUtil";
import {
  filterNonCollectionKeys,
  getMovedFromSuffix,
} from "../../../utils/reader/bookDrag";

const NEW_COLLECTION_OPTION = "New collection";

class AddCollectionDialog extends Component<
  AddCollectionDialogProps,
  AddCollectionDialogState
> {
  constructor(props: AddCollectionDialogProps) {
    super(props);
    this.state = { isNew: true, collectionKey: "" };
  }

  componentWillUnmount() {
    if (this.props.dialogBooks && this.props.dialogBooks.length > 0) {
      this.props.handleCollectionDialogBooks([]);
    }
  }

  handleCancel = () => {
    this.props.handleAddCollectionDialog(false);
  };

  getBookKeys = (): string[] => {
    let bookKeys =
      this.props.dialogBooks && this.props.dialogBooks.length > 0
        ? this.props.dialogBooks
        : this.props.isSelectBook &&
            this.props.selectedBooks.includes(this.props.currentBook?.key)
          ? this.props.selectedBooks
          : this.props.currentBook?.key
            ? [this.props.currentBook.key]
            : [];
    return filterNonCollectionKeys(bookKeys).filter((key) => {
      return !CollectionUtil.isDeletedKey(key);
    });
  };

  handleComfirm = () => {
    let collectionKey = this.state.collectionKey;
    if (this.state.isNew) {
      const inputElement: HTMLInputElement = document.querySelector(
        ".add-collection-dialog-new-box"
      ) as HTMLInputElement;
      let name = (inputElement?.value || "").trim();
      if (!name) {
        toast(this.props.t("Collection name is required"));
        return;
      }
      if (CollectionUtil.isCollectionNameExists(name)) {
        toast(this.props.t("Collection name already exists"));
        return;
      }
      let collection = CollectionUtil.createCollection(name, []);
      if (!collection) {
        return;
      }
      collectionKey = collection.key;
    }
    let collection = CollectionUtil.getCollection(collectionKey);
    if (!collection) {
      return;
    }
    let bookKeys = this.getBookKeys().filter((key) => {
      return collection!.books.indexOf(key) === -1;
    });
    if (bookKeys.length === 0) {
      toast(this.props.t("Duplicate book"));
      return;
    }
    let { added, movedFrom } = CollectionUtil.addBooksToCollection(
      collectionKey,
      bookKeys
    );
    if (added > 0 || movedFrom.length > 0) {
      toast.success(
        this.props.t("Addition successful") + getMovedFromSuffix(movedFrom)
      );
    }
    if (this.props.isSelectBook) {
      this.props.handleSelectBook(false);
      this.props.handleSelectedBooks([]);
    }
    this.props.handleAddCollectionDialog(false);
    this.props.handleActionDialog(false);
    this.props.handleFetchBooks();
  };

  handleChange = (collectionKey: string) => {
    if (collectionKey === NEW_COLLECTION_OPTION) {
      this.setState({ isNew: true, collectionKey: "" });
    } else {
      this.setState({ isNew: false, collectionKey });
    }
  };

  render() {
    const renderCollectionList = () => {
      let collections = CollectionUtil.getCollectionList();
      return [
        <option
          value={NEW_COLLECTION_OPTION}
          key={NEW_COLLECTION_OPTION}
          className="add-collection-dialog-list-option"
        >
          {this.props.t("New collection")}
        </option>,
        ...collections.map((collection) => {
          return (
            <option
              value={collection.key}
              key={collection.key}
              className="add-collection-dialog-list-option"
            >
              {collection.name}
            </option>
          );
        }),
      ];
    };
    return (
      <div className="add-collection-dialog-container">
        <div className="add-collection-dialog-title">
          <Trans>Add to collection</Trans>
        </div>
        <div className="add-collection-dialog-list-container">
          <div className="add-collection-dialog-list-text">
            <Trans>Select</Trans>
          </div>
          <select
            className="add-collection-dialog-list-box"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              this.handleChange(event.target.value);
            }}
          >
            {renderCollectionList()}
          </select>
        </div>
        <div className="add-collection-dialog-list-container">
          <div className="add-collection-dialog-new-text">
            <Trans>New</Trans>
          </div>
          <input
            className="add-collection-dialog-new-box"
            disabled={!this.state.isNew}
          />
        </div>
        <div className="add-collection-dialog-button-container">
          <div
            className="add-collection-dialog-cancel"
            onClick={() => {
              this.handleCancel();
            }}
          >
            <Trans>Cancel</Trans>
          </div>
          <div
            className="add-collection-dialog-confirm"
            onClick={() => {
              this.handleComfirm();
            }}
          >
            <Trans>Confirm</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default AddCollectionDialog;
