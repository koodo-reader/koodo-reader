import React, { useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { AddCollectionDialogProps } from "./interface";
import "./addCollectionDialog.css";
import toast from "react-hot-toast";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  filterNonCollectionKeys,
  getMovedFromSuffix,
} from "../../../utils/reader/bookDrag";

const collectionUtil = new CollectionUtil(ConfigService);

const NEW_COLLECTION_OPTION = "New collection";

const AddCollectionDialog = (props: AddCollectionDialogProps) => {
  const [isNew, setIsNew] = useState(true);
  const [collectionKey, setCollectionKey] = useState("");
  const dialogBooksRef = useRef(props.dialogBooks);
  dialogBooksRef.current = props.dialogBooks;

  useEffect(() => {
    return () => {
      if (dialogBooksRef.current && dialogBooksRef.current.length > 0) {
        props.handleCollectionDialogBooks([]);
      }
    };
  }, []);

  const handleCancel = () => {
    props.handleAddCollectionDialog(false);
  };

  const getBookKeys = (): string[] => {
    let bookKeys =
      props.dialogBooks && props.dialogBooks.length > 0
        ? props.dialogBooks
        : props.isSelectBook &&
            props.selectedBooks.includes(props.currentBook?.key)
          ? props.selectedBooks
          : props.currentBook?.key
            ? [props.currentBook.key]
            : [];
    return filterNonCollectionKeys(bookKeys).filter((key) => {
      return !collectionUtil.isDeletedKey(key);
    });
  };

  const handleComfirm = () => {
    let targetCollectionKey = collectionKey;
    if (isNew) {
      const inputElement: HTMLInputElement = document.querySelector(
        ".add-collection-dialog-new-box"
      ) as HTMLInputElement;
      let name = (inputElement?.value || "").trim();
      if (!name) {
        toast(props.t("Collection name is required"));
        return;
      }
      if (collectionUtil.isCollectionNameExists(name)) {
        toast(props.t("Collection name already exists"));
        return;
      }
      let collection = collectionUtil.createCollection(name, []);
      if (!collection) {
        return;
      }
      targetCollectionKey = collection.key;
    }
    let collection = collectionUtil.getCollection(targetCollectionKey);
    if (!collection) {
      return;
    }
    let bookKeys = getBookKeys().filter((key) => {
      return collection!.books.indexOf(key) === -1;
    });
    if (bookKeys.length === 0) {
      toast(props.t("Duplicate book"));
      return;
    }
    let { added, movedFrom } = collectionUtil.addBooksToCollection(
      targetCollectionKey,
      bookKeys
    );
    if (added > 0 || movedFrom.length > 0) {
      toast.success(
        props.t("Addition successful") + getMovedFromSuffix(movedFrom)
      );
    }
    if (props.isSelectBook) {
      props.handleSelectBook(false);
      props.handleSelectedBooks([]);
    }
    props.handleAddCollectionDialog(false);
    props.handleActionDialog(false);
    props.handleFetchBooks();
  };

  const handleChange = (nextCollectionKey: string) => {
    if (nextCollectionKey === NEW_COLLECTION_OPTION) {
      setIsNew(true);
      setCollectionKey("");
    } else {
      setIsNew(false);
      setCollectionKey(nextCollectionKey);
    }
  };

  const renderCollectionList = () => {
    let collections = collectionUtil.getCollectionList();
    return [
      <option
        value={NEW_COLLECTION_OPTION}
        key={NEW_COLLECTION_OPTION}
        className="add-collection-dialog-list-option"
      >
        {props.t("New collection")}
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
    <div className="add-dialog-container">
      <div className="add-collection-dialog-title">
        <Trans>Add to collection</Trans>
      </div>
      <div className="add-collection-dialog-body">
        <div className="add-collection-dialog-field">
          <span className="add-collection-dialog-label">
            <Trans>Select</Trans>
          </span>
          <select
            className="add-collection-dialog-list-box"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              handleChange(event.target.value);
            }}
          >
            {renderCollectionList()}
          </select>
        </div>
        <div className="add-collection-dialog-field">
          <span className="add-collection-dialog-label">
            <Trans>New</Trans>
          </span>
          <input className="add-collection-dialog-new-box" disabled={!isNew} />
        </div>
      </div>
      <div className="add-collection-dialog-button-container">
        <div
          className="add-collection-dialog-cancel"
          onClick={() => {
            handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="add-collection-dialog-confirm"
          onClick={() => {
            handleComfirm();
          }}
        >
          <Trans>Confirm</Trans>
        </div>
      </div>
    </div>
  );
};

export default AddCollectionDialog;
