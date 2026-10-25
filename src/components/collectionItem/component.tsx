import React from "react";
import "./collectionItem.css";
import ActionDialog from "../dialogs/actionDialog";
import CollectionCover from "../collectionCover";
import { Trans } from "react-i18next";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { useCollectionItem } from "./useCollectionItem";
import {
  clampMenuPosition,
  estimateMenuHeight,
  CONTEXT_MENU_WIDTH,
} from "../../utils/common";
import { useAppStore } from "../../store/useAppStore";

import CollectionModel from "../../models/Collection";

export interface CollectionItemProps {
  collection: CollectionModel;
  viewMode: string;
  cardScale?: number;
  isSelected: boolean;
  allBooks?: { key: string }[];
  bookIndex?: number;
}

declare var window: any;

const CollectionItem: React.FC<CollectionItemProps> = (props) => {
  const isOpenActionDialog = useAppStore((s) => s.book.isOpenActionDialog);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const isSelectBook = useAppStore((s) => s.manager.isSelectBook);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const refreshBookKey = useAppStore((s) => s.manager.refreshBookKey);
  const handleReadingBook = useAppStore((s) => s.handleReadingBook);
  const handleActionDialog = useAppStore((s) => s.handleActionDialog);
  const handleSelectBook = useAppStore((s) => s.handleSelectBook);
  const handleSelectedBooks = useAppStore((s) => s.handleSelectedBooks);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleCollectionDetailDialog = useAppStore(
    (s) => s.handleCollectionDetailDialog
  );
  const handleCurrentCollectionKey = useAppStore(
    (s) => s.handleCurrentCollectionKey
  );
  const {
    left,
    setLeft,
    top,
    setTop,
    isHover,
    setIsHover,
    isDropTarget,
    collectionBook,
    percentage,
    handleJump,
    handleSelectIconClick,
    isFavoriteBook,
    isTopBook,
    handleBookDragStart,
    handleCollectionDropDragOver,
    handleCollectionDropDragEnter,
    handleCollectionDropDragLeave,
    handleCollectionBookDrop,
  } = useCollectionItem({
    ...props,
    refreshBookKey,
    isSelectBook,
    selectedBooks,
    handleReadingBook,
    handleSelectBook,
    handleSelectedBooks,
    handleFetchBooks,
    handleCollectionDetailDialog,
    handleCurrentCollectionKey,
  });

  const { collection, viewMode } = props;
  const scale =
    props.cardScale ??
    parseFloat(ConfigService.getReaderConfig("cardScale") || "1");
  const count = collection.books.length;

  const handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300) {
      x = x - 190;
    } else {
      x = x - 10;
    }
    const y =
      document.body.clientHeight - e.clientY > 250
        ? e.clientY - 10
        : e.clientY - 240;
    const pos = clampMenuPosition(
      x,
      y,
      CONTEXT_MENU_WIDTH,
      estimateMenuHeight(10)
    );
    setLeft(pos.left);
    setTop(pos.top);
    handleActionDialog(true);
    handleReadingBook(collectionBook);
  };

  const actionProps = { left, top };
  const dropHandlers = {
    onDragOver: handleCollectionDropDragOver,
    onDragEnter: handleCollectionDropDragEnter,
    onDragLeave: handleCollectionDropDragLeave,
    onDrop: handleCollectionBookDrop,
  };
  const renderPercentage = () => (
    <>
      {percentage && !isNaN(parseFloat(percentage))
        ? percentage === "0"
          ? "New"
          : percentage === "1"
            ? "Done"
            : (parseFloat(percentage) * 100).toFixed(2)
        : "0"}
      {percentage &&
        !isNaN(parseFloat(percentage)) &&
        percentage !== "0" &&
        percentage !== "1" && <span>%</span>}
    </>
  );
  const renderCover = (width: number, height: number) => (
    <div
      className={
        "collection-cover-wrapper" +
        (isDropTarget ? " collection-drop-target" : "")
      }
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <CollectionCover
        bookKeys={collection.books}
        refreshBookKey={refreshBookKey}
        width={width}
        height={height}
      />
      <span className="collection-count-badge">{count}</span>
    </div>
  );
  const renderActionDialog = () =>
    isOpenActionDialog &&
    currentBook &&
    collection.key === currentBook.key ? (
      <div className="action-dialog-parent">
        <ActionDialog {...(actionProps as any)} />
      </div>
    ) : null;

  if (viewMode === "list") {
    return (
      <>
        <div
          className="book-list-item-container"
          draggable
          onDragStart={handleBookDragStart}
          onContextMenu={(event) => {
            handleMoreAction(event);
          }}
          {...dropHandlers}
        >
          <div
            className="book-item-list-cover"
            onClick={(event) => {
              handleJump(event);
            }}
            onMouseEnter={() => {
              setIsHover(true);
            }}
            onMouseLeave={() => {
              setIsHover(false);
            }}
            style={{ height: "65px" }}
          >
            {renderCover(43, 65)}
          </div>
          {isSelectBook || isHover ? (
            <span
              className="icon-message book-selected-icon"
              onMouseEnter={() => {
                setIsHover(true);
              }}
              onClick={(event) => {
                handleSelectIconClick(event);
              }}
              style={
                props.isSelected
                  ? { left: "18px", bottom: "5px", opacity: 1 }
                  : { left: "18px", bottom: "5px", color: "#eee" }
              }
            ></span>
          ) : null}
          <div
            className="book-item-list-title"
            onClick={(event) => {
              handleJump(event);
            }}
          >
            <div className="book-item-list-subtitle">
              <div className="book-item-list-subtitle-text">
                {(isFavoriteBook() || isTopBook()) && (
                  <span className="book-item-list-status">
                    {isFavoriteBook() && (
                      <span className="icon-heart book-item-list-favorite"></span>
                    )}
                    {isTopBook() && (
                      <span className="icon-pin book-item-list-top"></span>
                    )}
                  </span>
                )}
                <span className="icon-folder collection-title-icon"></span>
                {collection.name}
              </div>
            </div>

            <p className="book-item-list-percentage">{renderPercentage()}</p>
            <div className="book-item-list-author">
              <Trans i18nKey="Total books" count={count}>
                {"Total " + count + " books"}
              </Trans>
            </div>
          </div>
        </div>
        {renderActionDialog()}
      </>
    );
  }

  if (viewMode === "cover") {
    return (
      <>
        <div
          className="book-list-cover-item"
          draggable
          onDragStart={handleBookDragStart}
          onContextMenu={(event) => {
            handleMoreAction(event);
          }}
          {...dropHandlers}
        >
          <div className="book-cover-item-header">
            <div className="reading-progress-icon">
              <div style={{ position: "relative", left: "4px" }}>
                {renderPercentage()}
              </div>
            </div>
            <span
              className="icon-more book-more-action"
              onClick={(event) => {
                handleMoreAction(event);
              }}
            ></span>
            {(isFavoriteBook() || isTopBook()) && (
              <span className="book-cover-status-actions">
                {isFavoriteBook() && (
                  <span className="icon-heart book-heart-action"></span>
                )}
                {isTopBook() && (
                  <span className="icon-pin book-top-action"></span>
                )}
              </span>
            )}
          </div>

          <div
            className="book-cover-item-cover"
            onClick={(event) => {
              handleJump(event);
            }}
            onMouseEnter={() => {
              setIsHover(true);
            }}
            onMouseLeave={() => {
              setIsHover(false);
            }}
            style={{
              height: "170px",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {renderCover(120, 170)}
            {isSelectBook || isHover ? (
              <span
                className="icon-message book-selected-icon"
                onMouseEnter={() => {
                  setIsHover(true);
                }}
                onClick={(event) => {
                  handleSelectIconClick(event);
                }}
                style={
                  props.isSelected
                    ? {
                        right: "272px",
                        top: "30px",
                        opacity: 1,
                      }
                    : {
                        right: "272px",
                        top: "30px",
                        color: "#eee",
                      }
                }
              ></span>
            ) : null}
          </div>

          <p className="book-cover-item-title">
            <span className="icon-folder collection-title-icon"></span>
            {collection.name}
          </p>
          <p className="book-cover-item-author">
            <Trans i18nKey="Total books" count={count}>
              {"Total " + count + " books"}
            </Trans>
          </p>
        </div>
        {renderActionDialog()}
      </>
    );
  }

  return (
    <>
      <div
        className="book-list-item"
        draggable
        onDragStart={handleBookDragStart}
        onContextMenu={(event) => {
          handleMoreAction(event);
        }}
        {...dropHandlers}
      >
        <div
          className="book-item-cover"
          onClick={(event) => {
            handleJump(event);
          }}
          onMouseDown={(event) => {
            if (event.shiftKey) {
              event.preventDefault();
            }
          }}
          onMouseEnter={() => {
            setIsHover(true);
          }}
          onMouseLeave={() => {
            setIsHover(false);
          }}
          style={{
            height: `${137 * scale}px`,
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {renderCover(105 * scale, 137 * scale)}
        </div>
        {isSelectBook || isHover ? (
          <span
            className="icon-message book-selected-icon"
            onMouseEnter={() => {
              setIsHover(true);
            }}
            onClick={(event) => {
              handleSelectIconClick(event);
            }}
            style={
              props.isSelected
                ? { opacity: 1 }
                : {
                    color: "#eee",
                  }
            }
          ></span>
        ) : null}

        <p className="book-item-title">
          <span className="icon-folder collection-title-icon"></span>
          {collection.name}
        </p>
        <div className="reading-progress-icon">
          <div style={{ position: "relative", left: "4px" }}>
            {renderPercentage()}
          </div>
        </div>

        <span
          className="icon-more book-more-action"
          onClick={(event) => {
            handleMoreAction(event);
          }}
        ></span>
        {(isFavoriteBook() || isTopBook()) && (
          <span className="book-status-actions">
            {isFavoriteBook() && (
              <span className="icon-heart book-heart-action"></span>
            )}
            {isTopBook() && <span className="icon-pin book-top-action"></span>}
          </span>
        )}
      </div>

      {renderActionDialog()}
    </>
  );
};

export default CollectionItem;
