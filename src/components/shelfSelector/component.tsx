import React from "react";
import ShelfUtil from "../../utils/readUtils/shelfUtil";
import { Trans } from "react-i18next";
import { ShelfSelectorProps, ShelfSelectorState } from "./interface";

import DeletePopup from "../dialogs/deletePopup";
import { withRouter } from "react-router-dom";
import { backup } from "../../utils/syncUtils/backupUtil";
import { isElectron } from "react-device-detect";
declare var window: any;
class ShelfSelector extends React.Component<
  ShelfSelectorProps,
  ShelfSelectorState
> {
  constructor(props: ShelfSelectorProps) {
    super(props);
    this.state = {
      shelfIndex: 0,
      isOpenDelete: false,
    };
  }

  handleShelfItem = (event: any) => {
    let index = event.target.value.split(",")[1];
    this.setState({ shelfIndex: index });
    this.props.handleShelfIndex(index);
    if (index > 0) {
      this.props.handleMode("shelf");
    } else {
      this.props.handleMode("home");
    }
  };
  handleDeleteShelf = () => {
    if (this.state.shelfIndex < 1) return;
    let shelfTitles = Object.keys(ShelfUtil.getShelf());
    let currentShelfTitle = shelfTitles[this.state.shelfIndex];
    ShelfUtil.removeShelf(currentShelfTitle);
    this.setState({ shelfIndex: 0 }, () => {
      this.props.handleShelfIndex(0);
      this.props.handleMode("shelf");
    });
  };
  handleDeletePopup = (isOpenDelete: boolean) => {
    this.setState({ isOpenDelete });
  };
  renderShelfList = () => {
    let shelfList = ShelfUtil.getShelf();
    let shelfTitle = Object.keys(shelfList);

    return shelfTitle.map((item, index) => {
      return (
        <option
          value={[item, index.toString()]}
          key={index}
          className="add-dialog-shelf-list-option"
          selected={this.props.shelfIndex === index ? true : false}
        >
          {this.props.t(item === "New" ? "Books" : item)}
        </option>
      );
    });
  };

  render() {
    if (isElectron) {
      window.localforage.getItem(this.props.books[0].key).then((result) => {
        if (result) {
          backup(
            this.props.books,
            this.props.notes,
            this.props.bookmarks,
            false
          );
        }
      });
    }
    const deletePopupProps = {
      mode: "shelf",
      name: Object.keys(ShelfUtil.getShelf())[this.state.shelfIndex],
      title: "Delete this shelf",
      description: "This action will clear and remove this shelf",
      handleDeletePopup: this.handleDeletePopup,
      handleDeleteOpearion: this.handleDeleteShelf,
    };

    return (
      <>
        {this.state.isOpenDelete && <DeletePopup {...deletePopupProps} />}
        <div className="booklist-shelf-container">
          <p
            className="general-setting-title"
            style={{ float: "left", height: "100%" }}
          >
            <Trans>Shelf</Trans>
          </p>
          <select
            className="booklist-shelf-list"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              this.handleShelfItem(event);
            }}
          >
            {this.renderShelfList()}
          </select>
          {this.state.shelfIndex > 0 ? (
            <span
              className="icon-trash delete-shelf-icon"
              onClick={() => {
                this.handleDeletePopup(true);
              }}
            ></span>
          ) : null}
        </div>
      </>
    );
  }
}

export default withRouter(ShelfSelector as any);
