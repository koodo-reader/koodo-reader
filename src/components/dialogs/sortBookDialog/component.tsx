import { useState } from "react";
import "./sortDialog.css";
import { Trans } from "react-i18next";
import { SortDialogProps } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

const SortDialog = (props: SortDialogProps) => {
  const [isNote] = useState(
    props.mode === "note" || props.mode === "highlight"
  );

  const handleSort = (code: number) => {
    if (isNote) {
      let noteSortCode = props.noteSortCode;
      noteSortCode.sort = code;
      props.handleNoteSortCode(noteSortCode);
      ConfigService.setReaderConfig(
        "noteSortCode",
        JSON.stringify({ sort: code, order: props.noteSortCode.order })
      );
      props.handleFetchNotes();
    } else {
      let bookSortCode = props.bookSortCode;
      bookSortCode.sort = code;
      props.handleBookSortCode(bookSortCode);
      ConfigService.setReaderConfig(
        "bookSortCode",
        JSON.stringify({ sort: code, order: props.bookSortCode.order })
      );
      props.handleFetchBooks();
    }
  };
  const handleOrder = (code: number) => {
    if (isNote) {
      let noteSortCode = props.noteSortCode;
      noteSortCode.order = code;
      ConfigService.setReaderConfig(
        "noteSortCode",
        JSON.stringify({ sort: props.noteSortCode.sort, order: code })
      );
      props.handleNoteSortCode(noteSortCode);
      props.handleFetchNotes();
    } else {
      let bookSortCode = props.bookSortCode;
      bookSortCode.order = code;
      ConfigService.setReaderConfig(
        "bookSortCode",
        JSON.stringify({ sort: props.bookSortCode.sort, order: code })
      );
      props.handleBookSortCode(bookSortCode);
      props.handleFetchBooks();
    }
  };

  let sortCode = isNote ? props.noteSortCode : props.bookSortCode;
  return (
    <div
      className="sort-dialog-container"
      onMouseLeave={() => {
        props.handleSortDisplay(false);
      }}
      onMouseEnter={() => {
        props.handleSortDisplay(true);
      }}
      style={isNote ? { height: "132px" } : {}}
    >
      {isNote ? (
        <ul className="sort-by-category">
          {["Sort by Date", "Reading progress"].map((item, index) => {
            return (
              <li
                className="sort-by-category-list"
                onClick={() => {
                  handleSort(index + 1);
                }}
                style={sortCode.sort === index + 1 ? {} : { opacity: 0.34 }}
                key={index + 1}
              >
                <Trans>{item}</Trans>
                {sortCode.sort === index + 1 && (
                  <span
                    className="icon-check"
                    style={{ fontWeight: "bold" }}
                  ></span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="sort-by-category">
          {[
            "Recently read",
            "Book name",
            "Sort by Date",
            "Reading duration",
            "Author name",
            "Reading progress",
            "File size",
          ].map((item, index) => {
            return (
              <li
                className="sort-by-category-list"
                onClick={() => {
                  handleSort(index + 1);
                }}
                style={sortCode.sort === index + 1 ? {} : { opacity: 0.34 }}
                key={index + 1}
              >
                <Trans>{item}</Trans>
                {sortCode.sort === index + 1 && (
                  <span
                    className="icon-check"
                    style={{ fontWeight: "bold" }}
                  ></span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="sort-dialog-seperator"></div>
      <ul className="sort-by-order">
        <li
          className="sort-by-order-list"
          onClick={() => {
            handleOrder(1);
          }}
          style={sortCode.order === 1 ? {} : { opacity: 0.34 }}
        >
          <Trans>Ascend</Trans>
          {sortCode.order === 1 && (
            <span className="icon-check" style={{ fontWeight: "bold" }}></span>
          )}
        </li>
        <li
          className="sort-by-order-list"
          onClick={() => {
            handleOrder(2);
          }}
          style={sortCode.order === 2 ? {} : { opacity: 0.34 }}
        >
          <Trans>Descend</Trans>
          {sortCode.order === 2 && (
            <span className="icon-check" style={{ fontWeight: "bold" }}></span>
          )}
        </li>
      </ul>
    </div>
  );
};

export default SortDialog;
