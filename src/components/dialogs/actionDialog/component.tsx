import React, { useState } from "react";
import "./actionDialog.css";
import { Trans } from "react-i18next";
import { ActionDialogProps, ActionDialogState } from "./interface";
import toast from "react-hot-toast";
import MoreAction from "../moreAction";
import MarkAction from "../markAction";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  CONTEXT_MENU_WIDTH,
  shouldSubmenuOpenLeft,
  vexComfirmAsync,
} from "../../../utils/common";

const collectionUtil = new CollectionUtil(ConfigService);
declare var window: any;

const ActionDialog = (props: ActionDialogProps) => {
  const [state, setState] = useState<ActionDialogState>(() => ({
    isShowExport: false,
    isShowMark: false,
    isExceed: shouldSubmenuOpenLeft(props.left, CONTEXT_MENU_WIDTH),
  }));

  const updateState = (patch: Partial<ActionDialogState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const handleDeleteBook = () => {
    props.handleReadingBook(props.currentBook);
    props.handleDeleteDialog(true);
    props.handleActionDialog(false);
  };
  const handleEditBook = () => {
    if (collectionUtil.isCollection(props.currentBook.key)) {
      props.handleCollectionDialogKey(props.currentBook.key);
      props.handleCollectionDialog(true);
      props.handleActionDialog(false);
      return;
    }
    props.handleEditDialog(true);
    props.handleReadingBook(props.currentBook);
    props.handleActionDialog(false);
  };
  const handleDetailBook = () => {
    if (collectionUtil.isCollection(props.currentBook.key)) {
      props.handleCurrentCollectionKey(props.currentBook.key);
      props.handleCollectionDetailDialog(true);
      props.handleActionDialog(false);
      return;
    }
    props.handleDetailDialog(true);
    props.handleReadingBook(props.currentBook);
    props.handleActionDialog(false);
  };
  const handleAddShelf = () => {
    props.handleAddDialog(true);
    props.handleReadingBook(props.currentBook);
    props.handleActionDialog(false);
  };
  const handleAddCollection = () => {
    props.handleAddCollectionDialog(true);
    props.handleReadingBook(props.currentBook);
    props.handleActionDialog(false);
  };
  const handleDissolveCollection = async () => {
    let key = props.currentBook.key;
    let collection = collectionUtil.getCollection(key);
    if (!collection) return;
    let result = await vexComfirmAsync(
      `<h3>${props.t("Dissolve collection")}</h3><p>${props.t(
        "The collection will be removed and all books will be kept in your library."
      )}</p>`
    );
    if (!result) return;
    collectionUtil.dissolveCollection(key);
    toast.success(props.t("Deletion successful"));
    props.handleActionDialog(false);
    props.handleFetchBooks();
  };
  const handleRestoreBook = () => {
    ConfigService.deleteListConfig(props.currentBook.key, "deletedBooks");
    props.handleActionDialog(false);
    toast.success(props.t("Restore successful"));
    props.handleFetchBooks();
  };
  const handleLoveBook = () => {
    ConfigService.setListConfig(props.currentBook.key, "favoriteBooks");
    toast.success(props.t("Addition successful"));
    props.handleActionDialog(false);
  };
  const handleMultiSelect = () => {
    props.handleSelectBook(true);
    props.handleSelectedBooks([props.currentBook.key]);
    props.handleActionDialog(false);
  };
  const handleTopBook = () => {
    ConfigService.setListConfig(props.currentBook.key, "topBooks");
    toast.success(props.t("Addition successful"));
    props.handleActionDialog(false);
    props.handleFetchBooks();
  };
  const handleCancelTopBook = () => {
    ConfigService.deleteListConfig(props.currentBook.key, "topBooks");
    toast.success(props.t("Cancellation successful"));
    props.handleActionDialog(false);
    props.handleFetchBooks();
  };
  const handleCancelLoveBook = () => {
    ConfigService.deleteListConfig(props.currentBook.key, "favoriteBooks");
    if (collectionUtil.isCollection(props.currentBook.key)) {
      let collection = collectionUtil.getCollection(props.currentBook.key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteListConfig(bookKey, "favoriteBooks");
        });
      }
    }
    if (
      Object.keys(ConfigService.getAllListConfig("favoriteBooks")).length === 0 &&
      props.mode === "favorite"
    ) {
      props.history.push("/manager/empty");
    }
    toast.success(props.t("Cancellation successful"));
    props.handleActionDialog(false);
    props.handleFetchBooks();
  };
  const handleMoreAction = (isShow: boolean) => {
    updateState({ isShowExport: isShow });
  };
  const handleMarkAction = (isShow: boolean) => {
    updateState({ isShowMark: isShow });
  };

  const isCollection = collectionUtil.isCollection(props.currentBook.key);
  const collection = isCollection
    ? collectionUtil.getCollection(props.currentBook.key)
    : null;
  const isFavorite = collection
    ? collectionUtil.isCollectionFavorite(collection)
    : ConfigService.getAllListConfig("favoriteBooks").indexOf(
        props.currentBook.key
      ) > -1;
  const moreActionProps = {
    left: props.left,
    top: props.top,
    isShowExport: state.isShowExport,
    isExceed: state.isExceed,
    handleMoreAction: handleMoreAction,
  };
  const markActionProps = {
    left: props.left,
    top: props.top,
    isShowMark: state.isShowMark,
    isExceed: state.isExceed,
    handleMarkAction: handleMarkAction,
    menuItemIndex: isCollection ? 6 : 7,
  };
  if (props.mode === "trash") {
    return (
      <div
        className="action-dialog-container"
        onMouseLeave={() => {
          props.handleActionDialog(false);
        }}
        onMouseEnter={() => {
          props.handleActionDialog(true);
        }}
        style={{
          left: props.left,
          top: props.top,
        }}
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-add"
            onClick={() => {
              handleRestoreBook();
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
          props.handleActionDialog(false);
        }}
        onMouseEnter={() => {
          props.handleActionDialog(true);
        }}
        style={{ left: props.left, top: props.top }}
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-add"
            onClick={() => {
              if (isFavorite) {
                handleCancelLoveBook();
              } else {
                handleLoveBook();
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
              handleAddShelf();
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
                handleAddCollection();
              }}
            >
              <span
                className="icon-folder view-icon"
                style={{ fontSize: "14px" }}
              ></span>
              <p className="action-name">
                <Trans>Add to collection</Trans>
              </p>
            </div>
          )}
          <div
            className="action-dialog-add"
            onClick={() => {
              handleMultiSelect();
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
                  props.currentBook.key
                ) > -1
              ) {
                handleCancelTopBook();
              } else {
                handleTopBook();
              }
            }}
          >
            <span
              className="icon-sort-desc view-icon"
              style={{ display: "inline-block", transform: "rotate(180deg)" }}
            ></span>
            <p className="action-name">
              {ConfigService.getAllListConfig("topBooks").indexOf(
                props.currentBook.key
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
              handleDeleteBook();
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
              handleEditBook();
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
              updateState({
                isShowMark: true,
                isShowExport: false,
                isExceed: shouldSubmenuOpenLeft(
                  props.left,
                  CONTEXT_MENU_WIDTH
                ),
              });
              const e = event || window.event;
              let x = e.clientX;
              if (x > document.body.clientWidth - 300) {
                updateState({ isExceed: true });
              } else {
                updateState({ isExceed: false });
              }
            }}
            onMouseLeave={(event) => {
              updateState({ isShowMark: false });
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
              handleDetailBook();
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
                handleDissolveCollection();
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
                updateState({
                  isShowExport: true,
                  isShowMark: false,
                  isExceed: shouldSubmenuOpenLeft(
                    props.left,
                    CONTEXT_MENU_WIDTH
                  ),
                });
                const e = event || window.event;
                let x = e.clientX;
                if (x > document.body.clientWidth - 300) {
                  updateState({ isExceed: true });
                } else {
                  updateState({ isExceed: false });
                }
              }}
              onMouseLeave={(event) => {
                updateState({ isShowExport: false });
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
};

export default ActionDialog;
