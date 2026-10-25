import React from "react";
import "./bookListItem.css";
import { BookItemProps } from "./interface";
import { Trans } from "react-i18next";
import EmptyCover from "../emptyCover";
import ActionDialog from "../dialogs/actionDialog";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { useBookItem } from "../bookItem/useBookItem";
import { getFileNameWithoutExtension } from "../../utils/common";
import {
  clampMenuPosition,
  estimateMenuHeight,
  CONTEXT_MENU_WIDTH,
} from "../../utils/common";
import { useAppStore } from "../../store/useAppStore";

declare var window: any;

const BookListItem: React.FC<BookItemProps> = (props) => {
  const isOpenActionDialog = useAppStore((s) => s.book.isOpenActionDialog);
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
    if (x > document.body.clientWidth - 300) {
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
          "book-list-item-container" +
          (isDropTarget ? " book-drop-target" : "")
        }
        draggable
        onDragStart={handleBookDragStart}
        onContextMenu={(event) => {
          handleMoreAction(event);
        }}
        {...dropHandlers}
      >
        {!isCoverExist ||
        (props.book.format === "PDF" &&
          ConfigService.getReaderConfig("isDisablePDFCover") === "yes") ? (
          <div
            className="book-item-list-cover"
            onClick={() => {
              handleJump();
            }}
            style={{ height: "65px" }}
            onMouseEnter={() => {
              setIsHover(true);
            }}
            onMouseLeave={() => {
              setIsHover(false);
            }}
          >
            <div className="book-item-image" style={{ height: "65px" }}>
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
                  scale: 0.43,
                }}
              />
            </div>
          </div>
        ) : (
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
          >
            <img
              src={cover}
              alt=""
              draggable={false}
              className="book-item-image"
              style={{ width: "100%" }}
              onLoad={(res: any) => {
                if (
                  res.target.naturalHeight / res.target.naturalWidth >
                  74 / 47
                ) {
                  setDirection("horizontal");
                } else {
                  setDirection("vertical");
                }
              }}
            />
          </div>
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
                ? { left: "18px", bottom: "5px", opacity: 1 }
                : { left: "18px", bottom: "5px", color: "#eee" }
            }
          ></span>
        ) : null}
        <p
          className="book-item-list-title"
          onClick={(event) => {
            handleJump(event);
          }}
        >
          <div className="book-item-list-subtitle">
            <div className="book-item-list-subtitle-text">
              {!isBookOffline && (
                <span className="icon-cloud book-download-action"></span>
              )}
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
              {ConfigService.getReaderConfig("isUseOriginalName") === "yes"
                ? getFileNameWithoutExtension(props.book.path, props.book.name)
                : props.book.name}
            </div>
          </div>

          <p className="book-item-list-percentage">
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
          </p>
          <div className="book-item-list-author">
            <Trans>{props.book.author || "Unknown author"}</Trans>
          </div>
        </p>
      </div>
      {isOpenActionDialog && props.book.key === currentBook.key ? (
        <div className="action-dialog-parent">
          <ActionDialog {...(actionProps as any)} />
        </div>
      ) : null}
    </>
  );
};

export default BookListItem;
