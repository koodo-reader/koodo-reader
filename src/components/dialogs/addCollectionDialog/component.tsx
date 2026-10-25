import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
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

const AddCollectionDialog = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const isSelectBook = useAppStore((s) => s.manager.isSelectBook);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const dialogBooks = useAppStore((s) => s.collection.collectionDialogBooks);
  const handleAddCollectionDialog = useAppStore(
    (s) => s.handleAddCollectionDialog
  );
  const handleActionDialog = useAppStore((s) => s.handleActionDialog);
  const handleSelectBook = useAppStore((s) => s.handleSelectBook);
  const handleSelectedBooks = useAppStore((s) => s.handleSelectedBooks);
  const handleCollectionDialogBooks = useAppStore(
    (s) => s.handleCollectionDialogBooks
  );
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const { t } = useTranslation();
  const [isNew, setIsNew] = useState(true);
  const [collectionKey, setCollectionKey] = useState("");
  const dialogBooksRef = useRef(dialogBooks);
  dialogBooksRef.current = dialogBooks;

  useEffect(() => {
    return () => {
      if (dialogBooksRef.current && dialogBooksRef.current.length > 0) {
        handleCollectionDialogBooks([]);
      }
    };
  }, []);

  const handleCancel = () => {
    handleAddCollectionDialog(false);
  };

  const getBookKeys = (): string[] => {
    let bookKeys =
      dialogBooks && dialogBooks.length > 0
        ? dialogBooks
        : isSelectBook &&
            selectedBooks.includes(currentBook?.key)
          ? selectedBooks
          : currentBook?.key
            ? [currentBook.key]
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
        toast(t("Collection name is required"));
        return;
      }
      if (collectionUtil.isCollectionNameExists(name)) {
        toast(t("Collection name already exists"));
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
      toast(t("Duplicate book"));
      return;
    }
    let { added, movedFrom } = collectionUtil.addBooksToCollection(
      targetCollectionKey,
      bookKeys
    );
    if (added > 0 || movedFrom.length > 0) {
      toast.success(
        t("Addition successful") + getMovedFromSuffix(movedFrom)
      );
    }
    if (isSelectBook) {
      handleSelectBook(false);
      handleSelectedBooks([]);
    }
    handleAddCollectionDialog(false);
    handleActionDialog(false);
    handleFetchBooks();
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
        {t("New collection")}
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
