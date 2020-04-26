import React from "react";
import "./sortDialog.css";
import { connect } from "react-redux";
import OtherUtil from "../../utils/otherUtil";
import { handleSortCode } from "../../redux/manager.redux";
import { stateType } from "../../store";

export interface SortDialogProps {
  sortCode: { sort: number; order: number };
  handleSortCode: (sortCode: { sort: number; order: number }) => void;
}

class SortDialog extends React.Component<SortDialogProps> {
  handleSort = (code: number) => {
    let sortCode = this.props.sortCode;
    sortCode.sort = code;
    this.setState({ sortCode });
    this.props.handleSortCode(sortCode);
    OtherUtil.setSortCode(code, this.props.sortCode.order);
  };
  handleOrder = (code: number) => {
    let sortCode = this.props.sortCode;
    sortCode.order = code;
    this.setState({ sortCode });
    OtherUtil.setSortCode(this.props.sortCode.sort, code);
    this.props.handleSortCode(sortCode);
  };
  render() {
    return (
      <div className="sort-dialog-container">
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
            按名称
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
            按添加时间
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
            顺序
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
            逆序
          </li>
        </ul>
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
  return { sortCode: state.manager.sortCode };
};
const actionCreator = {
  handleSortCode,
};
export default connect(mapStateToProps, actionCreator)(SortDialog);
