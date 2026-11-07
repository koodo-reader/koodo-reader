import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import "./collectionDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { useAppStore } from "../../../store/useAppStore";

const collectionUtil = new CollectionUtil(ConfigService);

const CollectionDialog = () => {
  const collectionDialogKey = useAppStore((s) => s.collection.collectionDialogKey);
  const handleCollectionDialog = useAppStore((s) => s.handleCollectionDialog);
  const handleCollectionDialogKey = useAppStore(
    (s) => s.handleCollectionDialogKey
  );
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleActionDialog = useAppStore((s) => s.handleActionDialog);
  const { t } = useTranslation();
  const [name, setName] = useState("");

  useEffect(() => {
    let collection = collectionUtil.getCollection(collectionDialogKey);
    if (collection) {
      setName(collection.name);
    }
  }, []);

  const closeDialog = () => {
    handleCollectionDialog(false);
    handleCollectionDialogKey("");
  };

  const handleCancel = () => {
    closeDialog();
  };

  const handleComfirm = () => {
    let trimmedName = name.trim();
    if (!trimmedName) {
      toast(t("Collection name is required"));
      return;
    }
    if (
      collectionUtil.isCollectionNameExists(
        trimmedName,
        collectionDialogKey
      )
    ) {
      toast(t("Collection name already exists"));
      return;
    }
    collectionUtil.updateCollection(collectionDialogKey, trimmedName);
    toast.success(t("Edition successful"));
    handleFetchBooks();
    handleActionDialog(false);
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
