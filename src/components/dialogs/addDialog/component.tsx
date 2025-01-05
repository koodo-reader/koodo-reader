import React, { Component } from "react";
import { Trans } from "react-i18next";
import { AddDialogProps, AddDialogState } from "./interface";
import "./addDialog.css";
import toast from "react-hot-toast";
import ConfigService from "../../../utils/storage/configService";

class AddDialog extends Component<AddDialogProps, AddDialogState> {
  constructor(props: AddDialogProps) {
    super(props);
    this.state = { isNew: true, shelfTitle: "" };
  }

  handleCancel = () => {
    this.props.handleAddDialog(false);
  };
  handleComfirm = () => {
    const inputElement: HTMLInputElement = document.querySelector(
      ".add-dialog-new-shelf-box"
    ) as HTMLInputElement;
    let shelfTitle: string = this.state.shelfTitle;
    let shelfList = ConfigService.getAllMapConfig("shelfList");

    if (this.state.isNew) {
      shelfTitle = inputElement.value;
      if (shelfList.hasOwnProperty(shelfTitle)) {
        toast(this.props.t("Duplicate shelf"));
        return;
      }
    }
    if (!shelfTitle) {
      toast(this.props.t("Shelf Title is Empty"));
      return;
    }
    if (
      !this.props.isSelectBook &&
      shelfList[shelfTitle] &&
      shelfList[shelfTitle].indexOf(this.props.currentBook.key) > -1
    ) {
      toast(this.props.t("Duplicate book"));
      return;
    }
    if (this.props.isSelectBook) {
      this.props.selectedBooks.forEach((item) => {
        ConfigService.setMapConfig(shelfTitle, item, "shelfList");
      });
      this.props.handleSelectBook(!this.props.isSelectBook);
      if (this.props.isSelectBook) {
        this.props.handleSelectedBooks([]);
      }
    } else {
      ConfigService.setMapConfig(
        shelfTitle,
        this.props.currentBook.key,
        "shelfList"
      );
    }

    this.props.handleAddDialog(false);
    toast.success(this.props.t("Addition successful"));
    this.props.handleActionDialog(false);
    this.props.handleMode("shelf");
    this.props.handleShelf(shelfTitle);
  };
  handleChange = (shelfTitle: string) => {
    if (shelfTitle === "New") {
      this.setState({ isNew: true });
    } else {
      this.setState({ shelfTitle });
      this.setState({ isNew: false });
    }
  };
  render() {
    const renderShelfList = () => {
      let shelfTitle = [
        "New",
        ...Object.keys(ConfigService.getAllMapConfig("shelfList")),
      ];
      return shelfTitle.map((item) => {
        return (
          <option
            value={item}
            key={item}
            className="add-dialog-shelf-list-option"
          >
            {this.props.t(item)}
          </option>
        );
      });
    };
    return (
      <div className="add-dialog-container">
        <div className="add-dialog-title">
          <Trans>Add to shelf</Trans>
        </div>
        <div className="add-dialog-shelf-list-container">
          <div className="add-dialog-shelf-list-text">
            <Trans>Select</Trans>
          </div>
          <select
            className="add-dialog-shelf-list-box"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              this.handleChange(event.target.value);
            }}
          >
            {renderShelfList()}
          </select>
        </div>
        <div className="add-dialog-new-shelf-container">
          <div className="add-dialog-new-shelf-text">
            <Trans>New shelf</Trans>
          </div>
          <input
            className="add-dialog-new-shelf-box"
            disabled={!this.state.isNew}
          />
        </div>
        <div className="add-dialog-button-container">
          <div
            className="add-dialog-cancel"
            onClick={() => {
              this.handleCancel();
            }}
          >
            <Trans>Cancel</Trans>
          </div>
          <div
            className="add-dialog-confirm"
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

export default AddDialog;
