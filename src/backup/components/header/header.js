//header 页面
import React, { Component } from "react";
import "./header.css";
import { connect } from "react-redux";
import SearchBox from "../searchBox/searchBox";
import ImportLocal from "../importLocal/importLocal";
import About from "../about/about";
import {
  handleFetchBooks,
  handleSort,
  handleSortCode,
  handleSortDisplay,
  handleMessageBox,
  handleMessage
} from "../../redux/manager.redux";
import { handleBackup } from "../../redux/backupPage.redux";
// @connect(state => state.manager)
class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSort: this.props.isSort,
      sortCode: this.props.sortCode,
      isSortDisplay: this.props.isSortDisplay,
      isOnlyLocal: false
      // md5: null
    };
  }
  UNSAFE_componentWillReceiveProps = nextProps => {
    // console.log(nextProps);
    this.setState({
      isSort: nextProps.isSort,
      isSortDisplay: nextProps.isSortDisplay,
      sortCode: nextProps.sortCode
    });
  };

  handleSortBooks = () => {
    console.log(this.state.isSortDisplay, "ahdgslahg");
    if (this.state.isSortDisplay) {
      this.props.handleSortDisplay(false);
    } else {
      this.props.handleSortDisplay(true);
    }

    // this.props.handleSortDisplay(!this.state.isSortDisplay);
    // console.log(this.state.isSortDisplay);
  };
  handleBackup = () => {
    console.log("dgsghsg");
    this.props.handleBackup(true);
  };
  handleOnlyLocal = () => {
    this.setState({ isOnlyLocal: !this.state.isOnlyLocal });
    this.props.handleMessage("下载客户端体验完整功能");
    this.props.handleMessageBox(true);
  };
  render() {
    // const classes = this.props.classes;

    return (
      <div className="header">
        <SearchBox />
        <div
          className="header-sort-container"
          onClick={() => {
            this.handleSortBooks();
          }}
        >
          <span className="header-sort-text">排序</span>
          <span className="icon-sort header-sort-icon"></span>
        </div>
        {this.state.isSort}
        {
          // <div className="only-local-container">
          //   <span className="only-local-text">只显示本地图书</span>
          //   <div
          //     className="only-local-icon"
          //     onClick={() => {
          //       this.handleOnlyLocal();
          //     }}
          //   >
          //     <div
          //       className="only-local-slider"
          //       style={this.state.isOnlyLocal ? { marginLeft: "16px" } : {}}
          //     ></div>
          //   </div>
          // </div>
        }
        <About />
        <ImportLocal />

        <div
          className="import-from-cloud"
          onClick={() => {
            this.handleBackup();
          }}
        >
          备份和恢复
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    books: state.manager.books,
    isSearch: state.manager.isSearch,
    isSortDisplay: state.manager.isSortDisplay
  };
};
const actionCreator = {
  handleFetchBooks,
  handleSort,
  handleSortCode,
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
  handleBackup
};
Header = connect(mapStateToProps, actionCreator)(Header);
export default Header;
