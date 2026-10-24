import "../actionDialog/actionDialog.css";
import { Trans } from "react-i18next";
import { MarkActionProps } from "./interface";
import toast from "react-hot-toast";
import {
  ConfigService,
  CollectionUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  clampMenuPosition,
  CONTEXT_MENU_WIDTH,
  estimateMenuHeight,
  SUBMENU_GAP,
} from "../../../utils/common";

const collectionUtil = new CollectionUtil(ConfigService);

const MENU_ITEM_HEIGHT = 33;
const MENU_CONTAINER_PADDING = 5;
const DEFAULT_MENU_INDEX = 6;

const MarkAction = (props: MarkActionProps) => {
  const getMenuIndex = () => {
    return props.menuItemIndex ?? DEFAULT_MENU_INDEX;
  };

  const handleMarkAsFinished = () => {
    const key = props.currentBook.key;
    if (collectionUtil.isCollection(key)) {
      let collection = collectionUtil.getCollection(key);
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
    toast.success(props.t("Modification successful"));
    props.handleRefreshBookCover(key);
    props.handleFetchBooks();
    props.handleMarkAction(false);
    props.handleActionDialog(false);
  };

  const handleMarkAsUnread = () => {
    const key = props.currentBook.key;
    if (collectionUtil.isCollection(key)) {
      let collection = collectionUtil.getCollection(key);
      if (collection) {
        collection.books.forEach((bookKey) => {
          ConfigService.deleteObjectConfig(bookKey, "recordLocation");
        });
      }
    } else {
      ConfigService.deleteObjectConfig(key, "recordLocation");
    }
    toast.success(props.t("Modification successful"));
    props.handleRefreshBookCover(key);
    props.handleFetchBooks();
    props.handleMarkAction(false);
    props.handleActionDialog(false);
  };

  const menuIndex = getMenuIndex();
  const submenuTopOffset =
    MENU_CONTAINER_PADDING + menuIndex * MENU_ITEM_HEIGHT - 34;
  return (
    <div
      className="action-dialog-container"
      onMouseLeave={() => {
        props.handleMarkAction(false);
        props.handleActionDialog(false);
      }}
      onMouseEnter={(event) => {
        props.handleMarkAction(true);
        props.handleActionDialog(true);
        event?.stopPropagation();
      }}
      style={
        props.isShowMark
          ? (() => {
              const pos = clampMenuPosition(
                props.left + (props.isExceed ? -SUBMENU_GAP : SUBMENU_GAP),
                props.top + submenuTopOffset,
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
            handleMarkAsFinished();
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
            handleMarkAsUnread();
          }}
        >
          <p className="action-name">
            <Trans>Mark as unread</Trans>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarkAction;
