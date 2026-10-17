import React from "react";
import "./collectionDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService, CollectionUtil } from "../../../assets/lib/kookit-extra-browser.min";
import {
  CollectionDialogProps,
  CollectionDialogState,
} from "./interface";

const collectionUtil = new CollectionUtil(ConfigService);

class CollectionDialog extends React.Component<
  CollectionDialogProps,
  CollectionDialogState
> {
  constructor(props: CollectionDialogProps) {
    super(props);
    this.state = { name: "" };
  }

  componentDidMount() {
    let collection = collectionUtil.getCollection(
      this.props.collectionDialogKey
    );
    if (collection) {
      this.setState({
        name: collection.name,
      });
    }
  }

  handleCancel = () => {
    this.closeDialog();
  };

  closeDialog = () => {
    this.props.handleCollectionDialog(false);
    this.props.handleCollectionDialogKey("");
  };

  handleComfirm = () => {
    let name = this.state.name.trim();
    if (!name) {
      toast(this.props.t("Collection name is required"));
      return;
    }
    if (
      collectionUtil.isCollectionNameExists(
        name,
        this.props.collectionDialogKey
      )
    ) {
      toast(this.props.t("Collection name already exists"));
      return;
    }
    collectionUtil.updateCollection(this.props.collectionDialogKey, name);
    toast.success(this.props.t("Edition successful"));
    this.props.handleFetchBooks();
    this.props.handleActionDialog(false);
    this.closeDialog();
  };

  render() {
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
