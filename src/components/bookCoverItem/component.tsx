import React from "react";
import "./bookCoverItem.css";
import { BookCoverProps } from "./interface";
import ActionDialog from "../dialogs/actionDialog";
import { withRouter } from "react-router-dom";
import EmptyCover from "../emptyCover";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { useBookItem } from "../bookItem/useBookItem";

declare var window: any;

const BookCoverItem: React.FC<BookCoverProps> = (props) => {
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
    isFavoriteBook,
    setIsFavorite,
  } = useBookItem(props);

  const handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300 && !props.isCollapsed) {
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

  const percentage = getPercentage();

  var htmlString = props.book.description;
  var div = document.createElement("div");
  div.innerHTML = htmlString;
  var textContent = div.textContent || div.innerText;

  const actionProps = { left, top };

  return (
    <>
      <div
        className="book-list-cover-item"
        onContextMenu={(event) => {
          handleMoreAction(event);
        }}
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
          {isFavoriteBook() && (
            <span className="icon-heart book-heart-action"></span>
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
                  title: props.book.name,
                  scale: 1.14,
                }}
              />
            </div>
          ) : (
            <img
              src={cover}
              alt=""
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
          {props.book.name}
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
      {props.isOpenActionDialog && props.book.key === props.currentBook.key ? (
        <ActionDialog {...actionProps} />
      ) : null}
    </>
  );
};

export default withRouter(BookCoverItem as any);
