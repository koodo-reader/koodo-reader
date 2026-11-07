import { useState } from "react";
import "./sortDialog.css";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

const SortDialog = () => {
  const bookSortCode = useAppStore((s) => s.manager.bookSortCode);
  const noteSortCode = useAppStore((s) => s.manager.noteSortCode);
  const mode = useAppStore((s) => s.sidebar.mode);
  const handleBookSortCode = useAppStore((s) => s.handleBookSortCode);
  const handleNoteSortCode = useAppStore((s) => s.handleNoteSortCode);
  const handleSortDisplay = useAppStore((s) => s.handleSortDisplay);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleFetchNotes = useAppStore((s) => s.handleFetchNotes);
  const [isNote] = useState(mode === "note" || mode === "highlight");

  const handleSort = (code: number) => {
    if (isNote) {
      let nextNoteSortCode = noteSortCode;
      nextNoteSortCode.sort = code;
      handleNoteSortCode(nextNoteSortCode);
      ConfigService.setReaderConfig(
        "noteSortCode",
        JSON.stringify({ sort: code, order: noteSortCode.order })
      );
      handleFetchNotes();
    } else {
      let nextBookSortCode = bookSortCode;
      nextBookSortCode.sort = code;
      handleBookSortCode(nextBookSortCode);
      ConfigService.setReaderConfig(
        "bookSortCode",
        JSON.stringify({ sort: code, order: bookSortCode.order })
      );
      handleFetchBooks();
    }
  };
  const handleOrder = (code: number) => {
    if (isNote) {
      let nextNoteSortCode = noteSortCode;
      nextNoteSortCode.order = code;
      ConfigService.setReaderConfig(
        "noteSortCode",
        JSON.stringify({ sort: noteSortCode.sort, order: code })
      );
      handleNoteSortCode(nextNoteSortCode);
      handleFetchNotes();
    } else {
      let nextBookSortCode = bookSortCode;
      nextBookSortCode.order = code;
      ConfigService.setReaderConfig(
        "bookSortCode",
        JSON.stringify({ sort: bookSortCode.sort, order: code })
      );
      handleBookSortCode(nextBookSortCode);
      handleFetchBooks();
    }
  };

  let sortCode = isNote ? noteSortCode : bookSortCode;
  return (
    <div
      className="sort-dialog-container"
      onMouseLeave={() => {
        handleSortDisplay(false);
      }}
      onMouseEnter={() => {
        handleSortDisplay(true);
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
