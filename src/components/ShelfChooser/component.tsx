import React from "react";
import ShelfUtil from "../../utils/readUtils/shelfUtil";
import { Trans } from "react-i18next";
import { ShelfChooserProps, ShelfChooserState } from "./interface";
import localforage from "localforage";
import DeletePopup from "../dialogs/deletePopup";
import { withRouter } from "react-router-dom";
import { backup } from "../../utils/syncUtils/backupUtil";
import { isElectron } from "react-device-detect";
class ShelfChooser extends React.Component<
  ShelfChooserProps,
  ShelfChooserState
> {
  constructor(props: ShelfChooserProps) {
    super(props);
    this.state = {
      shelfIndex: 0,
      isOpenDelete: false,
    };
  }

  //切换书架
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
    //获取当前书架名
    let currentShelfTitle = shelfTitles[this.state.shelfIndex];
    ShelfUtil.removeShelf(currentShelfTitle);
    this.setState({ shelfIndex: 0 }, () => {
      this.props.handleShelfIndex(0);
      this.props.handleMode("shelf");
    });
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
          {this.props.t(item === "New" ? "All Books" : item)}
        </option>
      );
    });
  };
  handleDeletePopup = (isOpenDelete: boolean) => {
    this.setState({ isOpenDelete });
  };
  render() {
    if (isElectron) {
      //兼容之前的版本
      localforage.getItem(this.props.books[0].key).then((result) => {
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
        <div
          className="booklist-shelf-container"
          style={this.props.isCollapsed ? {} : { left: "calc(50% - 60px)" }}
        >
          <p className="general-setting-title" style={{ display: "inline" }}>
            <Trans>My Shelves</Trans>
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

export default withRouter(ShelfChooser);
