//排序弹窗
import React from "react";
import "./sortDialog.css";
import OtherUtil from "../../utils/otherUtil";
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
      OtherUtil.setNoteSortCode(code, this.props.noteSortCode.order);
    } else {
      let bookSortCode = this.props.bookSortCode;
      bookSortCode.sort = code;
      this.props.handleBookSortCode(bookSortCode);
      this.props.handleBookSort(true);
      OtherUtil.setBookSortCode(code, this.props.bookSortCode.order);
    }
  };
  handleOrder = (code: number) => {
    if (this.state.isNote) {
      let noteSortCode = this.props.noteSortCode;
      noteSortCode.order = code;
      this.props.handleNoteSort(true);
      OtherUtil.setNoteSortCode(this.props.noteSortCode.sort, code);
      this.props.handleNoteSortCode(noteSortCode);
    } else {
      let bookSortCode = this.props.bookSortCode;
      bookSortCode.order = code;
      this.props.handleBookSort(true);
      OtherUtil.setBookSortCode(this.props.bookSortCode.sort, code);
      this.props.handleBookSortCode(bookSortCode);
    }
  };
  handleSortBooks = () => {
    if (this.props.isSortDisplay) {
      this.props.handleSortDisplay(false);
    } else {
      this.props.handleSortDisplay(true);
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
          this.handleSortBooks();
        }}
        style={this.state.isNote ? { height: "120px" } : {}}
      >
        {this.state.isNote ? (
          <ul className="sort-by-category">
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(1);
              }}
              style={
                sortCode.sort === 1 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Name</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(2);
              }}
              style={
                sortCode.sort === 2 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Date</Trans>
            </li>
          </ul>
        ) : (
          <ul className="sort-by-category">
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(0);
              }}
              style={
                sortCode.sort === 0 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Recent</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(1);
              }}
              style={
                sortCode.sort === 1 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Name</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(2);
              }}
              style={
                sortCode.sort === 2 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Date</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(3);
              }}
              style={
                sortCode.sort === 3 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Duration</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(4);
              }}
              style={
                sortCode.sort === 4 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Author</Trans>
            </li>
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleSort(5);
              }}
              style={
                sortCode.sort === 5 ? { color: "rgba(75, 75, 75, 1)" } : {}
              }
            >
              <Trans>Sort by Percentage</Trans>
            </li>
          </ul>
        )}
        <div className="sort-dialog-seperator"></div>
        <ul className="sort-by-order">
          <li
            className="sort-by-order-list"
            onClick={() => {
              this.handleOrder(1);
            }}
            style={sortCode.order === 1 ? { color: "rgba(75, 75, 75, 1)" } : {}}
          >
            <Trans>Ascending Order</Trans>
          </li>
          <li
            className="sort-by-order-list"
            onClick={() => {
              this.handleOrder(2);
            }}
            style={sortCode.order === 2 ? { color: "rgba(75, 75, 75, 1)" } : {}}
          >
            <Trans>Descending Order</Trans>
          </li>
        </ul>
      </div>
    );
  }
}

export default SortDialog;
