import React from "react";
import "./bookCardItem.css";
import { BookCardProps } from "./interface";
import ActionDialog from "../dialogs/actionDialog";
import { withRouter } from "react-router-dom";
import EmptyCover from "../emptyCover";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { useBookItem } from "../bookItem/useBookItem";

declare var window: any;

const BookCardItem: React.FC<BookCardProps> = (props) => {
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
  } = useBookItem(props);

  const handleMoreAction = (event: any) => {
    event.preventDefault();
    const e = event || window.event;
    let x = e.clientX;
    if (x > document.body.clientWidth - 300) {
      x = x - 190;
    } else {
      x = x - 10;
    }
    setLeft(x);
    setTop(
      document.body.clientHeight - e.clientY > 250
        ? e.clientY - 10
        : e.clientY - 220
    );
    props.handleActionDialog(true);
    props.handleReadingBook(props.book);
  };

  const percentage = getPercentage();
  const actionProps = { left, top };

  return (
    <>
      <div
        className="book-list-item"
        onContextMenu={(event) => {
          handleMoreAction(event);
        }}
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
          style={
            ConfigService.getReaderConfig("isDisableCrop") === "yes"
              ? {
                  height: `${168 * (props.cardScale ?? parseFloat(ConfigService.getReaderConfig("cardScale") || "1"))}px`,
                  alignItems: "flex-end",
                  background: "rgba(255, 255,255, 0)",
                  boxShadow: "0px 0px 5px rgba(0, 0, 0, 0)",
                }
              : {
                  height: `${137 * (props.cardScale ?? parseFloat(ConfigService.getReaderConfig("cardScale") || "1"))}px`,
                  alignItems: "center",
                  overflow: "hidden",
                }
          }
        >
          {!isCoverExist ||
          (props.book.format === "PDF" &&
            ConfigService.getReaderConfig("isDisablePDFCover") === "yes") ? (
            <div
              style={{
                width:
                  105 *
                  (props.cardScale ??
                    parseFloat(
                      ConfigService.getReaderConfig("cardScale") || "1"
                    )),
                height:
                  137 *
                  (props.cardScale ??
                    parseFloat(
                      ConfigService.getReaderConfig("cardScale") || "1"
                    )),
              }}
            >
              <EmptyCover
                {...{
                  format: props.book.format,
                  title: props.book.name,
                  viewMode: "card",
                  scale:
                    1 *
                    (props.cardScale ??
                      parseFloat(
                        ConfigService.getReaderConfig("cardScale") || "1"
                      )),
                }}
              />
            </div>
          ) : (
            <img
              src={cover}
              alt=""
              className="book-item-image"
              style={
                direction === "horizontal" ||
                ConfigService.getReaderConfig("isDisableCrop") === "yes"
                  ? { width: "100%" }
                  : { height: "100%" }
              }
              onLoad={(res: any) => {
                if (
                  res.target.naturalHeight / res.target.naturalWidth >
                  137 / 105
                ) {
                  setDirection("horizontal");
                } else {
                  setDirection("vertical");
                }
              }}
            ></img>
          )}
        </div>
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
                ? { opacity: 1 }
                : {
                    color: "#eee",
                  }
            }
          ></span>
        ) : null}

        <p className="book-item-title">
          {!isBookOffline && (
            <span className="icon-cloud book-download-action"></span>
          )}
          {props.book.name}
        </p>
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

      {props.isOpenActionDialog && props.book.key === props.currentBook.key ? (
        <div className="action-dialog-parent">
          <ActionDialog {...actionProps} />
        </div>
      ) : null}
    </>
  );
};

export default withRouter(BookCardItem as any);
