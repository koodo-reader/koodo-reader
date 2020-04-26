//图书加载前的动画
import React from "react";
import "./loadingPage.css";
import { connect } from "react-redux";
import BookModel from "../../model/Book";
import { stateType } from "../../store";

export interface LoadingPageProps {
  books: BookModel[];
}
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
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(LoadingPage);
