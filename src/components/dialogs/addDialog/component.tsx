import React, { Component } from "react";
import { Trans } from "react-i18next";
import { AddDialogProps, AddDialogState } from "./interface";
import "./addDialog.css";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

class AddDialog extends Component<AddDialogProps, AddDialogState> {
  constructor(props: AddDialogProps) {
    super(props);
    this.state = { isNew: true, shelfTitle: "", actionType: "copy" };
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
      ConfigService.setListConfig(shelfTitle, "sortedShelfList");
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
        if (this.state.actionType === "move") {
          ConfigService.deleteFromMapConfig(
            this.props.shelfTitle,
            item,
            "shelfList"
          );
        }
        ConfigService.setMapConfig(shelfTitle, item, "shelfList");
      });
      this.props.handleSelectBook(!this.props.isSelectBook);
      if (this.props.isSelectBook) {
        this.props.handleSelectedBooks([]);
      }
    } else {
      if (this.state.actionType === "move") {
        ConfigService.deleteFromMapConfig(
          this.props.shelfTitle,
          this.props.currentBook.key,
          "shelfList"
        );
      }

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
    if (shelfTitle === "New shelf") {
      this.setState({ isNew: true });
    } else {
      this.setState({ shelfTitle });
      this.setState({ isNew: false });
    }
  };
  render() {
    const renderShelfList = () => {
      let shelfTitle = [
        "New shelf",
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
      <div
        className="add-dialog-container"
        style={{ height: this.props.mode === "shelf" ? "240px" : "189px" }}
      >
        <div className="add-dialog-title">
          <Trans>Add to shelf</Trans>
        </div>
        {this.props.mode === "shelf" && (
          <div className="add-dialog-shelf-list-container">
            <div className="add-dialog-shelf-list-text">
              <Trans>Action</Trans>
            </div>
            <select
              className="add-dialog-shelf-list-box"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                this.setState({ actionType: event.target.value });
              }}
            >
              <option value="copy" className="add-dialog-shelf-list-option">
                {this.props.t("Copy to")}
              </option>
              <option value="move" className="add-dialog-shelf-list-option">
                {this.props.t("Move to")}
              </option>
            </select>
          </div>
        )}
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
        <div className="add-dialog-shelf-list-container">
          <div className="add-dialog-new-shelf-text">
            <Trans>New</Trans>
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
