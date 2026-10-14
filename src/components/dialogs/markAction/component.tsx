import React from "react";
import "../actionDialog/actionDialog.css";
import { Trans } from "react-i18next";
import { MarkActionProps } from "./interface";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import CollectionUtil from "../../../utils/file/collectionUtil";
import {
  clampMenuPosition,
  CONTEXT_MENU_WIDTH,
  estimateMenuHeight,
  SUBMENU_GAP,
} from "../../../utils/common";

const MENU_ITEM_HEIGHT = 33;
const MENU_CONTAINER_PADDING = 5;
const DEFAULT_MENU_INDEX = 6;

class MarkAction extends React.Component<MarkActionProps> {
  getMenuIndex = () => {
    return this.props.menuItemIndex ?? DEFAULT_MENU_INDEX;
  };

  handleMarkAsFinished = () => {
    const key = this.props.currentBook.key;
    if (CollectionUtil.isCollection(key)) {
      let collection = CollectionUtil.getCollection(key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          const existing = ConfigService.getObjectConfig(
            bookKey,
            "recordLocation",
            {}
          );
          ConfigService.setObjectConfig(
            bookKey,
            { ...existing, percentage: "1" },
            "recordLocation"
          );
        });
      }
    } else {
      const existing = ConfigService.getObjectConfig(key, "recordLocation", {});
      ConfigService.setObjectConfig(
        key,
        { ...existing, percentage: "1" },
        "recordLocation"
      );
    }
    toast.success(this.props.t("Modification successful"));
    this.props.handleRefreshBookCover(key);
    this.props.handleFetchBooks();
    this.props.handleMarkAction(false);
    this.props.handleActionDialog(false);
  };

  handleMarkAsUnread = () => {
    const key = this.props.currentBook.key;
    if (CollectionUtil.isCollection(key)) {
      let collection = CollectionUtil.getCollection(key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteObjectConfig(bookKey, "recordLocation");
        });
      }
    } else {
      ConfigService.deleteObjectConfig(key, "recordLocation");
    }
    toast.success(this.props.t("Modification successful"));
    this.props.handleRefreshBookCover(key);
    this.props.handleFetchBooks();
    this.props.handleMarkAction(false);
    this.props.handleActionDialog(false);
  };

  render() {
    const menuIndex = this.getMenuIndex();
    const submenuTopOffset =
      MENU_CONTAINER_PADDING + menuIndex * MENU_ITEM_HEIGHT - 34;
    return (
      <div
        className="action-dialog-container"
        onMouseLeave={() => {
          this.props.handleMarkAction(false);
          this.props.handleActionDialog(false);
        }}
        onMouseEnter={(event) => {
          this.props.handleMarkAction(true);
          this.props.handleActionDialog(true);
          event?.stopPropagation();
        }}
        style={
          this.props.isShowMark
            ? (() => {
                const pos = clampMenuPosition(
                  this.props.left +
                    (this.props.isExceed ? -SUBMENU_GAP : SUBMENU_GAP),
                  this.props.top + submenuTopOffset,
                  CONTEXT_MENU_WIDTH,
                  estimateMenuHeight(2)
                );
                return {
                  position: "fixed",
                  left: pos.left,
                  top: pos.top,
                };
              })()
            : { display: "none" }
        }
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={() => {
              this.handleMarkAsFinished();
            }}
          >
            <p className="action-name">
              <Trans>Mark as finished</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={() => {
              this.handleMarkAsUnread();
            }}
          >
            <p className="action-name">
              <Trans>Mark as unread</Trans>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default MarkAction;
