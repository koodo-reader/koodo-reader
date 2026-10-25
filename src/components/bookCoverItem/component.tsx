import React from "react";
import "./bookCoverItem.css";
import ActionDialog from "../dialogs/actionDialog";
import EmptyCover from "../emptyCover";
import { Trans } from "react-i18next";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { useBookItem } from "../bookItem/useBookItem";
import { getFileNameWithoutExtension } from "../../utils/common";
import {
  clampMenuPosition,
  estimateMenuHeight,
  CONTEXT_MENU_WIDTH,
} from "../../utils/common";
import { useAppStore } from "../../store/useAppStore";

import BookModel from "../../models/Book";

export interface BookCoverProps {
  book: BookModel;
  isSelected?: boolean;
  allBooks?: BookModel[];
  bookIndex?: number;
}

declare var window: any;

const BookCoverItem: React.FC<BookCoverProps> = (props) => {
  const isOpenActionDialog = useAppStore((s) => s.book.isOpenActionDialog);
  const isCollapsed = useAppStore((s) => s.sidebar.isCollapsed);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const isSelectBook = useAppStore((s) => s.manager.isSelectBook);
  const selectedBooks = useAppStore((s) => s.manager.selectedBooks);
  const refreshBookKey = useAppStore((s) => s.manager.refreshBookKey);
  const handleReadingBook = useAppStore((s) => s.handleReadingBook);
  const handleActionDialog = useAppStore((s) => s.handleActionDialog);
  const handleRefreshBookCover = useAppStore((s) => s.handleRefreshBookCover);
  const handleSelectBook = useAppStore((s) => s.handleSelectBook);
  const handleSelectedBooks = useAppStore((s) => s.handleSelectedBooks);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleCollectionDialogBooks = useAppStore(
    (s) => s.handleCollectionDialogBooks
  );
  const handleAddCollectionDialog = useAppStore(
    (s) => s.handleAddCollectionDialog
  );
  const {
    left,
    setLeft,
    top,
    setTop,
    direction,
    setDirection,
    isHover,
    setIsHover,
    cover,
    isCoverExist,
    isBookOffline,
    isDropTarget,
    handleJump,
    handleSelectIconClick,
    handleBookDragStart,
    handleBookDropDragOver,
    handleBookDropDragEnter,
    handleBookDropDragLeave,
    handleBookBookDrop,
    getPercentage,
    isFavoriteBook,
    isTopBook,
  } = useBookItem({
    ...props,
    refreshBookKey,
    isSelectBook,
    selectedBooks,
    handleRefreshBookCover,
    handleReadingBook,
    handleSelectBook,
    handleSelectedBooks,
    handleFetchBooks,
    handleCollectionDialogBooks,
    handleAddCollectionDialog,
  });

  const handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300 && !isCollapsed) {
      x = x - 180;
    }
    const pos = clampMenuPosition(
      x,
      document.body.clientHeight - e.clientY > 250
        ? e.clientY
        : e.clientY - 200,
      CONTEXT_MENU_WIDTH,
      estimateMenuHeight(10)
    );
    setLeft(pos.left);
    setTop(pos.top);
    handleActionDialog(true);
    handleReadingBook(props.book);
  };

  const percentage = getPercentage();

  // Do NOT assign book-supplied HTML to innerHTML, even on a detached element,
  // as that parses and fires inline event handlers (see CVE class in epubs).
  // Use DOMParser instead, which never executes scripts or event handlers.
  const textContent = props.book.description
    ? (new DOMParser()
        .parseFromString(props.book.description, "text/html")
        .documentElement.textContent?.trim() ?? "")
    : "";

  const actionProps = { left, top };
  const dropHandlers = {
    onDragOver: handleBookDropDragOver,
    onDragEnter: handleBookDropDragEnter,
    onDragLeave: handleBookDropDragLeave,
    onDrop: handleBookBookDrop,
  };

  return (
    <>
      <div
        className={
          "book-list-cover-item" + (isDropTarget ? " book-drop-target" : "")
        }
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
          style={
            ConfigService.getReaderConfig("isDisableCrop") === "yes"
              ? {
                  height: "195px",
                  alignItems: "flex-start",
                  background: "rgba(255, 255,255, 0)",
                  boxShadow: "0px 0px 5px rgba(0, 0, 0, 0)",
                }
              : {
                  height: "170px",
                  alignItems: "center",
                  overflow: "hidden",
                }
          }
        >
          {!isCoverExist ||
          (props.book.format === "PDF" &&
            ConfigService.getReaderConfig("isDisablePDFCover") === "yes") ? (
            <div
              className="book-item-image"
              style={{ width: "120px", height: "170px" }}
            >
              <EmptyCover
                {...{
                  format: props.book.format,
                  title:
                    ConfigService.getReaderConfig("isUseOriginalName") === "yes"
                      ? getFileNameWithoutExtension(
                          props.book.path,
                          props.book.name
                        )
                      : props.book.name,
                  scale: 1.14,
                }}
              />
            </div>
          ) : (
            <img
              src={cover}
              alt=""
              draggable={false}
              style={
                direction === "horizontal" ||
                ConfigService.getReaderConfig("isDisableCrop") === "yes"
                  ? { width: "100%" }
                  : { height: "100%" }
              }
              className="book-item-image"
              onLoad={(res: any) => {
                if (
                  res.target.naturalHeight / res.target.naturalWidth >
                  170 / 120
                ) {
                  setDirection("horizontal");
                } else {
                  setDirection("vertical");
                }
              }}
            />
          )}
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
          {!isBookOffline && (
            <span
              className="icon-cloud book-download-action"
              style={{ fontWeight: "bold" }}
            ></span>
          )}
          {ConfigService.getReaderConfig("isUseOriginalName") === "yes"
            ? getFileNameWithoutExtension(props.book.path, props.book.name)
            : props.book.name}
        </p>
        <p className="book-cover-item-author">
          <Trans>Author</Trans>:&nbsp;
          <Trans>{props.book.author || "Unknown author"}</Trans>
        </p>
        <p className="book-cover-item-author">
          <Trans>Publisher</Trans>:&nbsp;
          <Trans>{props.book.publisher}</Trans>
        </p>
        <div className="book-cover-item-desc">
          <Trans>Description</Trans>:&nbsp;
          <div className="book-cover-item-desc-detail">
            {props.book.description ? textContent : <Trans>Empty</Trans>}
          </div>
        </div>
      </div>
      {isOpenActionDialog && props.book.key === currentBook.key ? (
        <ActionDialog {...(actionProps as any)} />
      ) : null}
    </>
  );
};

export default BookCoverItem;
