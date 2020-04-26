//为空页面
import React from "react";
import { connect } from "react-redux";
import "./emptyPage.css";
import { emptyList } from "../../utils/readerConfig";
import { stateType } from "../../store";

export interface EmptyPageProps {
  mode: string;
}

export interface EmptyPageState {}

class EmptyPage extends React.Component<EmptyPageProps, EmptyPageState> {
  render() {
    const renderEmptyList = () => {
      return emptyList.map((item) => {
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
const mapStateToProps = (state: stateType) => {
  return {
    mode: state.sidebar.mode,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(EmptyPage);
