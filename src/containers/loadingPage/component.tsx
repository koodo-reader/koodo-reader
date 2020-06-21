//图书加载前的动画
import React from "react";
import "./loadingPage.css";
import { LoadingPageProps } from "./interface";
class LoadingPage extends React.Component<LoadingPageProps> {
  render() {
    const renderLoadingPage = () => {
      let arr = [];
      for (
        let i = 0;
        i < parseInt(localStorage.getItem("totalBooks") || "0");
        i++
      ) {
        arr.push(i);
      }
      return arr.map((item, index) => {
        return (
          <div className="loading-page-book" key={item}>
            <div
              className="loading-page-cover"
              style={{ opacity: `${(index % 7) * 0.2 + 0.2}` }}
            ></div>
          </div>
        );
      });
    };
    return (
      <div className="loading-page-container-parent">
        <div className="loading-page-container">{renderLoadingPage()}</div>
      </div>
    );
  }
}

export default LoadingPage;
