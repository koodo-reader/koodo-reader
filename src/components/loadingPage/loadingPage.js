//图书加载前的动画
import React, { Component } from "react";
import "./loadingPage.css";
import { connect } from "react-redux";
class LoadingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const renderLoadingPage = () => {
      let arr = [];
      for (let i = 0; i < localStorage.getItem("totalBooks"); i++) {
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
const mapStateToProps = (state) => {
  return {
    books: state.manager.books,
  };
};
const actionCreator = {};
LoadingPage = connect(mapStateToProps, actionCreator)(LoadingPage);
export default LoadingPage;
