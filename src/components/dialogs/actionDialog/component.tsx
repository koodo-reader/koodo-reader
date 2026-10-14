import React from "react";
import "./actionDialog.css";
import { Trans } from "react-i18next";
import { ActionDialogProps, ActionDialogState } from "./interface";
import toast from "react-hot-toast";
import MoreAction from "../moreAction";
import MarkAction from "../markAction";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import CollectionUtil from "../../../utils/file/collectionUtil";
import {
  CONTEXT_MENU_WIDTH,
  shouldSubmenuOpenLeft,
  vexComfirmAsync,
} from "../../../utils/common";
declare var window: any;
class ActionDialog extends React.Component<
  ActionDialogProps,
  ActionDialogState
> {
  constructor(props: ActionDialogProps) {
    super(props);
    this.state = {
      isShowExport: false,
      isShowMark: false,
      isShowDetail: false,
      isExceed: shouldSubmenuOpenLeft(this.props.left, CONTEXT_MENU_WIDTH),
    };
  }
  handleDeleteBook = () => {
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleDeleteDialog(true);
    this.props.handleActionDialog(false);
  };
  handleEditBook = () => {
    if (CollectionUtil.isCollection(this.props.currentBook.key)) {
      this.props.handleCollectionDialogMode("edit");
      this.props.handleCollectionDialogKey(this.props.currentBook.key);
      this.props.handleCollectionDialog(true);
      this.props.handleActionDialog(false);
      return;
    }
    this.props.handleEditDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleDetailBook = () => {
    if (CollectionUtil.isCollection(this.props.currentBook.key)) {
      this.props.handleCurrentCollectionKey(this.props.currentBook.key);
      this.props.handleCollectionDetailDialog(true);
      this.props.handleActionDialog(false);
      return;
    }
    this.props.handleDetailDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleAddShelf = () => {
    this.props.handleAddDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleAddCollection = () => {
    this.props.handleAddCollectionDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleDissolveCollection = async () => {
    let key = this.props.currentBook.key;
    let collection = CollectionUtil.getCollection(key);
    if (!collection) return;
    let result = await vexComfirmAsync(
      `<h3>${this.props.t("Dissolve collection")}</h3><p>${this.props.t(
        "The collection will be removed and all books will be kept in your library."
      )}</p>`
    );
    if (!result) return;
    CollectionUtil.dissolveCollection(key);
    toast.success(this.props.t("Deletion successful"));
    this.props.handleActionDialog(false);
    this.props.handleFetchBooks();
  };
  handleRestoreBook = () => {
    ConfigService.deleteListConfig(this.props.currentBook.key, "deletedBooks");
    this.props.handleActionDialog(false);
    toast.success(this.props.t("Restore successful"));
    this.props.handleFetchBooks();
  };
  handleLoveBook = () => {
    ConfigService.setListConfig(this.props.currentBook.key, "favoriteBooks");
    toast.success(this.props.t("Addition successful"));
    this.props.handleActionDialog(false);
  };
  handleMultiSelect = () => {
    this.props.handleSelectBook(true);
    this.props.handleSelectedBooks([this.props.currentBook.key]);
    this.props.handleActionDialog(false);
  };
  handleTopBook = () => {
    ConfigService.setListConfig(this.props.currentBook.key, "topBooks");
    toast.success(this.props.t("Addition successful"));
    this.props.handleActionDialog(false);
    this.props.handleFetchBooks();
  };
  handleCancelTopBook = () => {
    ConfigService.deleteListConfig(this.props.currentBook.key, "topBooks");
    toast.success(this.props.t("Cancellation successful"));
    this.props.handleActionDialog(false);
    this.props.handleFetchBooks();
  };
  handleCancelLoveBook = () => {
    ConfigService.deleteListConfig(this.props.currentBook.key, "favoriteBooks");
    if (CollectionUtil.isCollection(this.props.currentBook.key)) {
      let collection = CollectionUtil.getCollection(this.props.currentBook.key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteListConfig(bookKey, "favoriteBooks");
        });
      }
    }
    if (
      Object.keys(ConfigService.getAllListConfig("favoriteBooks")).length ===
        0 &&
      this.props.mode === "favorite"
    ) {
      this.props.history.push("/manager/empty");
    }
    toast.success(this.props.t("Cancellation successful"));
    this.props.handleActionDialog(false);
    this.props.handleFetchBooks();
  };
  handleMoreAction = (isShow: boolean) => {
    this.setState({ isShowExport: isShow });
  };
  handleMarkAction = (isShow: boolean) => {
    this.setState({ isShowMark: isShow });
  };
  render() {
    const isCollection = CollectionUtil.isCollection(
      this.props.currentBook.key
    );
    const collection = isCollection
      ? CollectionUtil.getCollection(this.props.currentBook.key)
      : null;
    const isFavorite = collection
      ? CollectionUtil.isCollectionFavorite(collection)
      : ConfigService.getAllListConfig("favoriteBooks").indexOf(
          this.props.currentBook.key
        ) > -1;
    const moreActionProps = {
      left: this.props.left,
      top: this.props.top,
      isShowExport: this.state.isShowExport,
      isExceed: this.state.isExceed,
      handleMoreAction: this.handleMoreAction,
    };
    const markActionProps = {
      left: this.props.left,
      top: this.props.top,
      isShowMark: this.state.isShowMark,
      isExceed: this.state.isExceed,
      handleMarkAction: this.handleMarkAction,
      menuItemIndex: isCollection ? 6 : 7,
    };
    if (this.props.mode === "trash") {
      return (
        <div
          className="action-dialog-container"
          onMouseLeave={() => {
            this.props.handleActionDialog(false);
          }}
          onMouseEnter={() => {
            this.props.handleActionDialog(true);
          }}
          style={{
            left: this.props.left,
            top: this.props.top,
          }}
        >
          <div className="action-dialog-actions-container">
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleRestoreBook();
              }}
            >
              <span className="icon-clockwise view-icon"></span>
              <span className="action-name">
                <Trans>Restore</Trans>
              </span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        <div
          className="action-dialog-container"
          onMouseLeave={() => {
            this.props.handleActionDialog(false);
          }}
          onMouseEnter={() => {
            this.props.handleActionDialog(true);
          }}
          style={{ left: this.props.left, top: this.props.top }}
        >
          <div className="action-dialog-actions-container">
            <div
              className="action-dialog-add"
              onClick={() => {
                if (isFavorite) {
                  this.handleCancelLoveBook();
                } else {
                  this.handleLoveBook();
                }
              }}
            >
              <span className="icon-heart view-icon"></span>
              <p className="action-name">
                {isFavorite ? (
                  <Trans>Remove from favorite</Trans>
                ) : (
                  <Trans>Add to favorite</Trans>
                )}
              </p>
            </div>
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleAddShelf();
              }}
            >
              <span className="icon-bookshelf-line view-icon"></span>
              <p className="action-name">
                <Trans>Add to shelf</Trans>
              </p>
            </div>
            {!isCollection && (
              <div
                className="action-dialog-add"
                onClick={() => {
                  this.handleAddCollection();
                }}
              >
                <span className="icon-folder view-icon"></span>
                <p className="action-name">
                  <Trans>Add to collection</Trans>
                </p>
              </div>
            )}
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleMultiSelect();
              }}
            >
              <span className="icon-select view-icon"></span>
              <p className="action-name">
                <Trans>Multiple selection</Trans>
              </p>
            </div>
            <div
              className="action-dialog-add"
              onClick={() => {
                if (
                  ConfigService.getAllListConfig("topBooks").indexOf(
                    this.props.currentBook.key
                  ) > -1
                ) {
                  this.handleCancelTopBook();
                } else {
                  this.handleTopBook();
                }
              }}
            >
              <span
                className="icon-sort-desc view-icon"
                style={{ display: "inline-block", transform: "rotate(180deg)" }}
              ></span>
              <p className="action-name">
                {ConfigService.getAllListConfig("topBooks").indexOf(
                  this.props.currentBook.key
                ) > -1 ? (
                  <Trans>Unpin from top</Trans>
                ) : (
                  <Trans>Pin to top</Trans>
                )}
              </p>
            </div>
            <div
              className="action-dialog-delete"
              onClick={() => {
                this.handleDeleteBook();
              }}
            >
              <span className="icon-trash-line view-icon"></span>
              <p className="action-name">
                <Trans>Delete</Trans>
              </p>
            </div>
            <div
              className="action-dialog-edit"
              onClick={() => {
                this.handleEditBook();
              }}
            >
              <span className="icon-edit-line view-icon"></span>
              <p className="action-name">
                <Trans>Edit</Trans>
              </p>
            </div>
            <div
              className="action-dialog-edit"
              onMouseEnter={(event) => {
                this.setState({
                  isShowMark: true,
                  isShowExport: false,
                  isExceed: shouldSubmenuOpenLeft(
                    this.props.left,
                    CONTEXT_MENU_WIDTH
                  ),
                });
                const e = event || window.event;
                let x = e.clientX;
                if (x > document.body.clientWidth - 300) {
                  this.setState({ isExceed: true });
                } else {
                  this.setState({ isExceed: false });
                }
              }}
              onMouseLeave={(event) => {
                this.setState({ isShowMark: false });
                event.stopPropagation();
              }}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <p className="action-name" style={{ marginLeft: "0px" }}>
                <span
                  className="icon-check view-icon"
                  style={{
                    display: "inline-block",
                    marginRight: "12px",
                    marginLeft: "3px",
                    fontSize: "14px",
                  }}
                ></span>
                <Trans>Mark as</Trans>
              </p>
              <span
                className="icon-dropdown icon-export-all"
                style={{ left: "95px" }}
              ></span>
            </div>
            <div
              className="action-dialog-edit"
              onClick={() => {
                this.handleDetailBook();
              }}
            >
              <span
                className="icon-idea-line view-icon"
                style={{ fontSize: "18px" }}
              ></span>
              <p className="action-name" style={{ marginLeft: "12px" }}>
                <Trans>Details</Trans>
              </p>
            </div>
            {isCollection && (
              <div
                className="action-dialog-delete"
                onClick={() => {
                  this.handleDissolveCollection();
                }}
              >
                <span
                  className="icon-close view-icon"
                  style={{ fontSize: "15px" }}
                ></span>
                <p className="action-name">
                  <Trans>Dissolve collection</Trans>
                </p>
              </div>
            )}
            {!isCollection && (
              <div
                className="action-dialog-edit"
                onMouseEnter={(event) => {
                  this.setState({
                    isShowExport: true,
                    isShowMark: false,
                    isExceed: shouldSubmenuOpenLeft(
                      this.props.left,
                      CONTEXT_MENU_WIDTH
                    ),
                  });
                  const e = event || window.event;
                  let x = e.clientX;
                  if (x > document.body.clientWidth - 300) {
                    this.setState({ isExceed: true });
                  } else {
                    this.setState({ isExceed: false });
                  }
                }}
                onMouseLeave={(event) => {
                  this.setState({ isShowExport: false });
                  event.stopPropagation();
                }}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <p className="action-name" style={{ marginLeft: "0px" }}>
                  <span
                    className="icon-more view-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "12px",
                      marginLeft: "3px",
                      transform: "rotate(90deg)",
                      fontSize: "14px",
                    }}
                  ></span>
                  <Trans>More actions</Trans>
                </p>

                <span
                  className="icon-dropdown icon-export-all"
                  style={{ left: "95px" }}
                ></span>
              </div>
            )}
          </div>
        </div>
        <MarkAction {...(markActionProps as any)} />
        <MoreAction {...(moreActionProps as any)} />
      </>
    );
  }
}

export default ActionDialog;
