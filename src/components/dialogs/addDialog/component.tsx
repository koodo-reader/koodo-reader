import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import "./addDialog.css";
import toast from "react-hot-toast";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";

const collectionUtil = new CollectionUtil(ConfigService);

const AddDialog = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const isSelectBook = useAppStore((s) => s.manager.isSelectBook);
  const mode = useAppStore((s) => s.sidebar.mode);
  const shelfTitle = useAppStore((s) => s.sidebar.shelfTitle);
  const handleAddDialog = useAppStore((s) => s.handleAddDialog);
  const handleActionDialog = useAppStore((s) => s.handleActionDialog);
  const handleSelectBook = useAppStore((s) => s.handleSelectBook);
  const handleMode = useAppStore((s) => s.handleMode);
  const handleShelf = useAppStore((s) => s.handleShelf);
  const handleSelectedBooks = useAppStore((s) => s.handleSelectedBooks);
  const { t } = useTranslation();
  const [isNew, setIsNew] = useState(true);
  const [selectedShelfTitle, setShelfTitle] = useState("");
  const [actionType, setActionType] = useState("copy");

  const handleCancel = () => {
    handleAddDialog(false);
  };
  const deleteKeyFromShelf = (key: string) => {
    ConfigService.deleteFromMapConfig(shelfTitle, key, "shelfList");
    if (collectionUtil.isCollection(key)) {
      let collection = collectionUtil.getCollection(key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteFromMapConfig(
            shelfTitle,
            bookKey,
            "shelfList"
          );
        });
      }
    }
  };
  const handleComfirm = () => {
    const inputElement: HTMLInputElement = document.querySelector(
      ".add-dialog-new-shelf-box"
    ) as HTMLInputElement;
    let targetShelfTitle: string = selectedShelfTitle;
    let shelfList = ConfigService.getAllMapConfig("shelfList");

    if (isNew) {
      targetShelfTitle = inputElement.value;
      if (shelfList.hasOwnProperty(targetShelfTitle)) {
        toast(t("Duplicate shelf"));
        return;
      }
      ConfigService.setListConfig(targetShelfTitle, "sortedShelfList");
    }
    if (!targetShelfTitle) {
      toast(t("Shelf Title is Empty"));
      return;
    }
    if (
      !isSelectBook &&
      shelfList[targetShelfTitle] &&
      shelfList[targetShelfTitle].indexOf(currentBook.key) > -1
    ) {
      toast(t("Duplicate book"));
      return;
    }
    if (isSelectBook) {
      selectedBooks.forEach((item) => {
        if (actionType === "move") {
          deleteKeyFromShelf(item);
        }
        ConfigService.setMapConfig(targetShelfTitle, item, "shelfList");
      });
      handleSelectBook(!isSelectBook);
      if (isSelectBook) {
        handleSelectedBooks([]);
      }
    } else {
      if (actionType === "move") {
        deleteKeyFromShelf(currentBook.key);
      }

      ConfigService.setMapConfig(
        targetShelfTitle,
        currentBook.key,
        "shelfList"
      );
    }

    handleAddDialog(false);
    toast.success(t("Addition successful"));
    handleActionDialog(false);
    handleMode("shelf");
    setTimeout(() => {
      handleShelf(targetShelfTitle);
    }, 1000);
  };
  const handleChange = (nextShelfTitle: string) => {
    if (nextShelfTitle === "New shelf") {
      setIsNew(true);
    } else {
      setShelfTitle(nextShelfTitle);
      setIsNew(false);
    }
  };
  const renderShelfList = () => {
    let sortedShelfList =
      ConfigService.getAllListConfig("sortedShelfList") || [];
    let shelfTitleList = Object.keys(
      ConfigService.getAllMapConfig("shelfList")
    );
    let shelfTitleOptions = [
      "New shelf",
      ...Array.from(new Set([...sortedShelfList, ...shelfTitleList])),
    ];
    return shelfTitleOptions.map((item) => {
      return (
        <option value={item} key={item} className="add-dialog-shelf-list-option">
          {t(item)}
        </option>
      );
    });
  };

  return (
    <div className="add-dialog-container">
      <div className="add-dialog-title">
        <Trans>Add to shelf</Trans>
      </div>
      <div className="add-dialog-body">
        {mode === "shelf" && (
          <div className="add-dialog-field">
            <span className="add-dialog-label">
              <Trans>Action</Trans>
            </span>
            <select
              className="add-dialog-shelf-list-box"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                setActionType(event.target.value);
              }}
            >
              <option value="copy" className="add-dialog-shelf-list-option">
                {t("Copy to")}
              </option>
              <option value="move" className="add-dialog-shelf-list-option">
                {t("Move to")}
              </option>
            </select>
          </div>
        )}
        <div className="add-dialog-field">
          <span className="add-dialog-label">
            <Trans>Select</Trans>
          </span>
          <select
            className="add-dialog-shelf-list-box"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              handleChange(event.target.value);
            }}
          >
            {renderShelfList()}
          </select>
        </div>
        <div className="add-dialog-field">
          <span className="add-dialog-label">
            <Trans>New</Trans>
          </span>
          <input className="add-dialog-new-shelf-box" disabled={!isNew} />
        </div>
      </div>
      <div className="add-dialog-button-container">
        <div
          className="add-dialog-cancel"
          onClick={() => {
            handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="add-dialog-confirm"
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

export default AddDialog;
