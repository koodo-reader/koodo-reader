import React from "react";
import "../actionDialog/actionDialog.css";
import { Trans } from "react-i18next";
import { MarkActionProps } from "./interface";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

const MENU_ITEM_HEIGHT = 33;
const MENU_CONTAINER_PADDING = 5;
const MARK_AS_MENU_INDEX = 6;
const SUBMENU_TOP_OFFSET =
  MENU_CONTAINER_PADDING + MARK_AS_MENU_INDEX * MENU_ITEM_HEIGHT - 34;

class MarkAction extends React.Component<MarkActionProps> {
  handleMarkAsFinished = () => {
    const key = this.props.currentBook.key;
    const existing = ConfigService.getObjectConfig(key, "recordLocation", {});
    ConfigService.setObjectConfig(
      key,
      { ...existing, percentage: "1" },
      "recordLocation"
    );
    toast.success(this.props.t("Modification successful"));
    this.props.handleRefreshBookCover(key);
    this.props.handleFetchBooks();
    this.props.handleMarkAction(false);
    this.props.handleActionDialog(false);
  };

  handleMarkAsUnread = () => {
    const key = this.props.currentBook.key;
    ConfigService.deleteObjectConfig(key, "recordLocation");
    toast.success(this.props.t("Modification successful"));
    this.props.handleRefreshBookCover(key);
    this.props.handleFetchBooks();
    this.props.handleMarkAction(false);
    this.props.handleActionDialog(false);
  };

  render() {
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
            ? {
                position: "fixed",
                left: this.props.left + (this.props.isExceed ? -195 : 195),
                top: this.props.top + SUBMENU_TOP_OFFSET,
              }
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
