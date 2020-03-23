import React, { Component } from "react";
import "./searchBox.css";
import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleSearchBooks,
  handleSearch
} from "../../redux/manager.redux";
import OtherUtil from "../../utils/otherUtil";
// @connect(state => state.manager)
class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearch: this.props.isSearch
      // md5: null
    };
  }
  UNSAFE_componentWillReceiveProps = nextProps => {
    // console.log(nextProps);
    this.setState({
      isSearch: nextProps.isSearch
    });
  };

  handleMouse = () => {
    let results = OtherUtil.MouseSearch(this.props.books);
    this.props.handleSearchBooks(results);
    this.props.handleSearch(true);
  };
  handleKey = event => {
    let results = OtherUtil.KeySearch(event, this.props.books);
    // console.log(results, "resultes");
    if (results !== undefined) {
      this.props.handleSearchBooks(results);
      this.props.handleSearch(true);
    }
  };

  handleCancel = () => {
    this.props.handleSearch(false);
    document.querySelector(".header-search-box").value = "";
  };

  render() {
    return (
      <div className="header-search-container">
        <input
          type="text"
          placeholder="搜索我的书库"
          className="header-search-box"
          onKeyDown={event => {
            this.handleKey(event);
          }}
        />
        {this.props.isSearch ? (
          <span
            className="header-search-text"
            onClick={() => {
              this.handleCancel();
            }}
          >
            取消
          </span>
        ) : (
          <span
            className="icon-search header-search-icon"
            onClick={() => {
              this.handleMouse();
            }}
          ></span>
        )}
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    books: state.manager.books,
    isSearch: state.manager.isSearch
  };
};
const actionCreator = {
  handleFetchBooks,
  handleSearchBooks,
  handleSearch
};
Header = connect(mapStateToProps, actionCreator)(Header);
export default Header;
