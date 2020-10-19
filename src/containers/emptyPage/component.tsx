//为空页面
import React from "react";
import "./emptyPage.css";
import { emptyList } from "../../constants/readerConfig";
import { Trans } from "react-i18next";
import { EmptyPageProps, EmptyPageState } from "./interface";

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
            <div className="empty-page-info-main">
              <Trans>{item.main}</Trans>
            </div>
            <div className="empty-page-info-sub">
              <Trans>{item.sub}</Trans>
            </div>
          </div>
        );
      });
    };
    return (
      <div
        className="empty-page-container"
        style={
          this.props.mode === "shelf"
            ? { top: 0, left: 0, width: "100%", height: "100%" }
            : {}
        }
      >
        <img
          src={
            process.env.NODE_ENV === "production"
              ? "./assets/empty.svg"
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

export default EmptyPage;
