import React from "react";
import "./bookListItem.css";
import { BookItemProps } from "./interface";
import { Trans } from "react-i18next";
import { withRouter } from "react-router-dom";
import EmptyCover from "../emptyCover";
import ActionDialog from "../dialogs/actionDialog";
import toast from "react-hot-toast";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { useBookItem } from "../bookItem/useBookItem";

declare var window: any;

const BookListItem: React.FC<BookItemProps> = (props) => {
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
    handleJump,
    handleSelectIconClick,
    getPercentage,
    setIsFavorite,
  } = useBookItem(props);

  const handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300) {
      x = x - 180;
    }
    setLeft(x);
    setTop(
      document.body.clientHeight - e.clientY > 250 ? e.clientY : e.clientY - 200
    );
    props.handleActionDialog(true);
    props.handleReadingBook(props.book);
  };

  const handleLoveBook = () => {
    ConfigService.setListConfig(props.book.key, "favoriteBooks");
    setIsFavorite(true);
    toast.success(props.t("Addition successful"));
  };

  const handleRestoreBook = () => {
    ConfigService.deleteListConfig(props.book.key, "deletedBooks");
    toast.success(props.t("Restore successful"));
    props.handleFetchBooks();
  };

  const percentage = getPercentage();
  const actionProps = { left, top };

  return (
    <>
      <div
        className="book-list-item-container"
        onContextMenu={(event) => {
          handleMoreAction(event);
        }}
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
                  title: props.book.name,
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
        {props.isSelectBook || isHover ? (
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
              {props.book.name}
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
      {props.isOpenActionDialog && props.book.key === props.currentBook.key ? (
        <div className="action-dialog-parent">
          <ActionDialog {...actionProps} />
        </div>
      ) : null}
    </>
  );
};

export default withRouter(BookListItem as any);
