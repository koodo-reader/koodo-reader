import React, { useEffect, useState } from "react";
import "./collectionDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { CollectionDialogProps } from "./interface";

const collectionUtil = new CollectionUtil(ConfigService);

const CollectionDialog = (props: CollectionDialogProps) => {
  const [name, setName] = useState("");

  useEffect(() => {
    let collection = collectionUtil.getCollection(props.collectionDialogKey);
    if (collection) {
      setName(collection.name);
    }
  }, []);

  const closeDialog = () => {
    props.handleCollectionDialog(false);
    props.handleCollectionDialogKey("");
  };

  const handleCancel = () => {
    closeDialog();
  };

  const handleComfirm = () => {
    let trimmedName = name.trim();
    if (!trimmedName) {
      toast(props.t("Collection name is required"));
      return;
    }
    if (
      collectionUtil.isCollectionNameExists(
        trimmedName,
        props.collectionDialogKey
      )
    ) {
      toast(props.t("Collection name already exists"));
      return;
    }
    collectionUtil.updateCollection(props.collectionDialogKey, trimmedName);
    toast.success(props.t("Edition successful"));
    props.handleFetchBooks();
    props.handleActionDialog(false);
    closeDialog();
  };

  return (
    <div className="collection-dialog-container">
      <div className="collection-dialog-title">
        <Trans>Edit collection</Trans>
      </div>
      <div className="collection-dialog-body">
        <div className="collection-dialog-field">
          <span className="collection-dialog-label">
            <Trans>Collection name</Trans>
          </span>
          <input
            className="collection-dialog-input"
            value={name}
            maxLength={100}
            autoFocus
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setName(event.target.value);
            }}
            onKeyDown={(event: React.KeyboardEvent) => {
              if (event.key === "Enter") {
                handleComfirm();
              }
            }}
          />
        </div>
      </div>
      <div className="collection-dialog-button-container">
        <div
          className="collection-dialog-cancel"
          onClick={() => {
            handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="collection-dialog-confirm"
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

export default CollectionDialog;
