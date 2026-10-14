import React from "react";
import "./collectionDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  CollectionDialogProps,
  CollectionDialogState,
} from "./interface";
import CollectionUtil from "../../../utils/file/collectionUtil";

class CollectionDialog extends React.Component<
  CollectionDialogProps,
  CollectionDialogState
> {
  constructor(props: CollectionDialogProps) {
    super(props);
    this.state = { name: "" };
  }

  componentDidMount() {
    if (this.props.collectionDialogMode === "edit") {
      let collection = CollectionUtil.getCollection(
        this.props.collectionDialogKey
      );
      if (collection) {
        this.setState({
          name: collection.name,
        });
      }
    }
  }

  handleCancel = () => {
    this.closeDialog();
  };

  closeDialog = () => {
    this.props.handleCollectionDialog(false);
    this.props.handleCollectionDialogBooks([]);
    this.props.handleCollectionDialogKey("");
    this.props.handleCollectionDialogMode("create");
  };

  handleComfirm = () => {
    let name = this.state.name.trim();
    if (!name) {
      toast(this.props.t("Collection name is required"));
      return;
    }
    let isEdit = this.props.collectionDialogMode === "edit";
    if (
      CollectionUtil.isCollectionNameExists(
        name,
        isEdit ? this.props.collectionDialogKey : undefined
      )
    ) {
      toast(this.props.t("Collection name already exists"));
      return;
    }
    if (isEdit) {
      CollectionUtil.updateCollection(this.props.collectionDialogKey, name);
      toast.success(this.props.t("Edition successful"));
    } else {
      let collection = CollectionUtil.createCollection(
        name,
        this.props.collectionDialogBooks
      );
      if (collection) {
        toast.success(this.props.t("Created successfully"));
        this.props.handleSelectBook(false);
        this.props.handleSelectedBooks([]);
      }
    }
    this.props.handleFetchBooks();
    this.props.handleActionDialog(false);
    this.closeDialog();
  };

  render() {
    let isEdit = this.props.collectionDialogMode === "edit";
    return (
      <div className="collection-dialog-container">
        <div className="collection-dialog-title">
          {isEdit ? <Trans>Edit collection</Trans> : <Trans>Create collection</Trans>}
        </div>
        <div className="collection-dialog-count">
          {!isEdit && (
            <Trans
              i18nKey="Total books"
              count={this.props.collectionDialogBooks.length}
            >
              {"Total " + this.props.collectionDialogBooks.length + " books"}
            </Trans>
          )}
        </div>
        <div className="collection-dialog-field-container">
          <div className="collection-dialog-field-text">
            <Trans>Collection name</Trans>
          </div>
          <input
            className="collection-dialog-input"
            value={this.state.name}
            maxLength={100}
            autoFocus
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              this.setState({ name: event.target.value });
            }}
            onKeyDown={(event: React.KeyboardEvent) => {
              if (event.key === "Enter") {
                this.handleComfirm();
              }
            }}
          />
        </div>
        <div className="collection-dialog-button-container">
          <div
            className="collection-dialog-cancel"
            onClick={() => {
              this.handleCancel();
            }}
          >
            <Trans>Cancel</Trans>
          </div>
          <div
            className="collection-dialog-confirm"
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

export default CollectionDialog;
