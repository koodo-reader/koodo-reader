import React from "react";
import "./loadingPage.css";
import { LoadingPageProps } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { Redirect } from "react-router-dom";

class LoadingPage extends React.Component<LoadingPageProps> {
  render() {
    if (this.props.books) {
      return <Redirect to="/manager/home" />;
    }
    let arr: number[] = [];
    for (
      let i = 0;
      i < parseInt(ConfigService.getReaderConfig("totalBooks")) || 0;
      i++
    ) {
      arr.push(i);
    }
    if (ConfigService.getReaderConfig("viewMode") !== "list") {
      const renderLoadingCard = () => {
        return arr.map((item, index) => {
          return (
            <div className="loading-page-book" key={item}>
              <div
                className="loading-page-cover"
                style={{ opacity: `${(index % 7) * 0.2}` }}
              ></div>
            </div>
          );
        });
      };
      return (
        <div className="loading-page-container-parent">
          <div className="loading-page-container">{renderLoadingCard()}</div>
        </div>
      );
    } else {
      const renderLoadingList = () => {
        return arr.map((item) => {
          return (
            <div className="loading-page-list" key={item}>
              <div className="loading-page-list-cover"></div>
              <div className="loading-page-bar">
                <div className="loading-page-bar1"></div>
                <div className="loading-page-bar2"></div>
                <div className="loading-page-bar3"></div>
              </div>
            </div>
          );
        });
      };
      return (
        <div className="loading-page-container-parent">
          <div className="loading-page-container" style={{ marginTop: "8px" }}>
            {renderLoadingList()}
          </div>
        </div>
      );
    }
  }
}

export default LoadingPage;
