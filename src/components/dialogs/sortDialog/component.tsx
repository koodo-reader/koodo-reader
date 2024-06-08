//排序弹窗
import React from "react";
import "./sortDialog.css";
import SortUtil from "../../../utils/readUtils/sortUtil";
import { Trans } from "react-i18next";
import { SortDialogProps, SortDialogState } from "./interface";

class SortDialog extends React.Component<SortDialogProps, SortDialogState> {
  constructor(props: SortDialogProps) {
    super(props);
    this.state = {
      isNote: this.props.mode === "note" || this.props.mode === "digest",
    };
  }

  handleSort = (code: number) => {
    if (this.state.isNote) {
      let noteSortCode = this.props.noteSortCode;
      noteSortCode.sort = code;
      this.props.handleNoteSortCode(noteSortCode);
      this.props.handleNoteSort(true);
      SortUtil.setNoteSortCode(code, this.props.noteSortCode.order);
    } else {
      let bookSortCode = this.props.bookSortCode;
      bookSortCode.sort = code;
      this.props.handleBookSortCode(bookSortCode);
      this.props.handleBookSort(true);
      SortUtil.setBookSortCode(code, this.props.bookSortCode.order);
    }
  };
  handleOrder = (code: number) => {
    if (this.state.isNote) {
      let noteSortCode = this.props.noteSortCode;
      noteSortCode.order = code;
      this.props.handleNoteSort(true);
      SortUtil.setNoteSortCode(this.props.noteSortCode.sort, code);
      this.props.handleNoteSortCode(noteSortCode);
    } else {
      let bookSortCode = this.props.bookSortCode;
      bookSortCode.order = code;
      this.props.handleBookSort(true);
      SortUtil.setBookSortCode(this.props.bookSortCode.sort, code);
      this.props.handleBookSortCode(bookSortCode);
    }
  };

  render() {
    let sortCode = this.state.isNote
      ? this.props.noteSortCode
      : this.props.bookSortCode;
    return (
      <div
        className="sort-dialog-container"
        onMouseLeave={() => {
          this.props.handleSortDisplay(false);
        }}
        onMouseEnter={() => {
          this.props.handleSortDisplay(true);
        }}
        style={this.state.isNote ? { height: "132px" } : {}}
      >
        {this.state.isNote ? (
          <ul className="sort-by-category">
            {["Book name", "Sort by Date"].map((item, index) => {
              return (
                <li
                  className="sort-by-category-list"
                  onClick={() => {
                    this.handleSort(index + 1);
                  }}
                  style={sortCode.sort === index + 1 ? {} : { opacity: 0.34 }}
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
            ].map((item, index) => {
              return (
                <li
                  className="sort-by-category-list"
                  onClick={() => {
                    this.handleSort(index + 1);
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
              this.handleOrder(1);
            }}
            style={sortCode.order === 1 ? {} : { opacity: 0.34 }}
          >
            <Trans>Ascend</Trans>
            {sortCode.order === 1 && (
              <span
                className="icon-check"
                style={{ fontWeight: "bold" }}
              ></span>
            )}
          </li>
          <li
            className="sort-by-order-list"
            onClick={() => {
              this.handleOrder(2);
            }}
            style={sortCode.order === 2 ? {} : { opacity: 0.34 }}
          >
            <Trans>Descend</Trans>
            {sortCode.order === 2 && (
              <span
                className="icon-check"
                style={{ fontWeight: "bold" }}
              ></span>
            )}
          </li>
        </ul>
      </div>
    );
  }
}

export default SortDialog;
