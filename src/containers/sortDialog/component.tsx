//排序弹窗
import React from "react";
import "./sortDialog.css";
import OtherUtil from "../../utils/otherUtil";
import { Trans } from "react-i18next";
import { SortDialogProps } from "./interface";

class SortDialog extends React.Component<SortDialogProps> {
  handleSort = (code: number) => {
    let sortCode = this.props.sortCode;
    sortCode.sort = code;
    this.setState({ sortCode });
    this.props.handleSortCode(sortCode);
    this.props.handleSort(true);
    OtherUtil.setSortCode(code, this.props.sortCode.order);
  };
  handleOrder = (code: number) => {
    let sortCode = this.props.sortCode;
    sortCode.order = code;
    this.setState({ sortCode });
    this.props.handleSort(true);
    OtherUtil.setSortCode(this.props.sortCode.sort, code);
    this.props.handleSortCode(sortCode);
  };
  handleSortBooks = () => {
    if (this.props.isSortDisplay) {
      this.props.handleSortDisplay(false);
    } else {
      this.props.handleSortDisplay(true);
    }
  };
  render() {
    return (
      <div
        className="sort-dialog-container"
        onMouseLeave={() => {
          this.handleSortBooks();
        }}
      >
        <ul className="sort-by-category">
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleSort(1);
            }}
            style={
              this.props.sortCode.sort === 1
                ? { color: "rgba(75, 75, 75, 1)" }
                : {}
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
              this.props.sortCode.sort === 2
                ? { color: "rgba(75, 75, 75, 1)" }
                : {}
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
              this.props.sortCode.sort === 3
                ? { color: "rgba(75, 75, 75, 1)" }
                : {}
            }
          >
            <Trans>Sort by Duration</Trans>
          </li>
        </ul>
        <div className="sort-dialog-seperator"></div>
        <ul className="sort-by-order">
          <li
            className="sort-by-order-list"
            onClick={() => {
              this.handleOrder(1);
            }}
            style={
              this.props.sortCode.order === 1
                ? { color: "rgba(75, 75, 75, 1)" }
                : {}
            }
          >
            <Trans>Ascending Order</Trans>
          </li>
          <li
            className="sort-by-order-list"
            onClick={() => {
              this.handleOrder(2);
            }}
            style={
              this.props.sortCode.order === 2
                ? { color: "rgba(75, 75, 75, 1)" }
                : {}
            }
          >
            <Trans>Descending Order</Trans>
          </li>
        </ul>
      </div>
    );
  }
}

export default SortDialog;
