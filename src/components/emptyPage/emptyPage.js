//为空页面
import React, { Component } from "react";
import { connect } from "react-redux";
import "./emptyPage.css";
import { emptyList } from "../../utils/readerConfig";
class EmptyPage extends Component {
  render() {
    const renderEmptyList = () => {
      return emptyList.map(item => {
        return (
          <div
            className="empty-page-info-container"
            key={item.mode}
            style={
              this.props.mode === item.mode ? {} : { visibility: "hidden" }
            }
          >
            <div className="empty-page-info-main">{item.main}</div>
            <div className="empty-page-info-sub">{item.sub}</div>
          </div>
        );
      });
    };
    return (
      <div className="empty-page-container">
        <img
          src={
            process.env.NODE_ENV === "production"
              ? "assets/empty.svg"
              : "../../assets/empty.svg"
          }
          alt=""
          className="empty-page-illustration"
        />
        {renderEmptyList()}
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    mode: state.sidebar.mode
  };
};
const actionCreator = {};
EmptyPage = connect(mapStateToProps, actionCreator)(EmptyPage);
export default EmptyPage;
