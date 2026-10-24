import React, { useState } from "react";
import { Trans } from "react-i18next";
import { AddDialogProps } from "./interface";
import "./addDialog.css";
import toast from "react-hot-toast";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";

const collectionUtil = new CollectionUtil(ConfigService);

const AddDialog = (props: AddDialogProps) => {
  const [isNew, setIsNew] = useState(true);
  const [shelfTitle, setShelfTitle] = useState("");
  const [actionType, setActionType] = useState("copy");

  const handleCancel = () => {
    props.handleAddDialog(false);
  };
  const deleteKeyFromShelf = (key: string) => {
    ConfigService.deleteFromMapConfig(props.shelfTitle, key, "shelfList");
    if (collectionUtil.isCollection(key)) {
      let collection = collectionUtil.getCollection(key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteFromMapConfig(
            props.shelfTitle,
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
    let targetShelfTitle: string = shelfTitle;
    let shelfList = ConfigService.getAllMapConfig("shelfList");

    if (isNew) {
      targetShelfTitle = inputElement.value;
      if (shelfList.hasOwnProperty(targetShelfTitle)) {
        toast(props.t("Duplicate shelf"));
        return;
      }
      ConfigService.setListConfig(targetShelfTitle, "sortedShelfList");
    }
    if (!targetShelfTitle) {
      toast(props.t("Shelf Title is Empty"));
      return;
    }
    if (
      !props.isSelectBook &&
      shelfList[targetShelfTitle] &&
      shelfList[targetShelfTitle].indexOf(props.currentBook.key) > -1
    ) {
      toast(props.t("Duplicate book"));
      return;
    }
    if (props.isSelectBook) {
      props.selectedBooks.forEach((item) => {
        if (actionType === "move") {
          deleteKeyFromShelf(item);
        }
        ConfigService.setMapConfig(targetShelfTitle, item, "shelfList");
      });
      props.handleSelectBook(!props.isSelectBook);
      if (props.isSelectBook) {
        props.handleSelectedBooks([]);
      }
    } else {
      if (actionType === "move") {
        deleteKeyFromShelf(props.currentBook.key);
      }

      ConfigService.setMapConfig(
        targetShelfTitle,
        props.currentBook.key,
        "shelfList"
      );
    }

    props.handleAddDialog(false);
    toast.success(props.t("Addition successful"));
    props.handleActionDialog(false);
    props.handleMode("shelf");
    setTimeout(() => {
      props.handleShelf(targetShelfTitle);
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
          {props.t(item)}
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
        {props.mode === "shelf" && (
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
                {props.t("Copy to")}
              </option>
              <option value="move" className="add-dialog-shelf-list-option">
                {props.t("Move to")}
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
