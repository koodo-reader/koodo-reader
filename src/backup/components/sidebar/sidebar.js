import React, { Component } from "react";
import "./sidebar.css";
import { handleMode, handleShelfIndex } from "../../redux/sidebar.redux";
import { connect } from "react-redux";
import { sideMenu } from "../../utils/readerConfig";
import ShelfUtil from "../../utils/shelfUtil";
// import About from "../about/about";
class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      index: ["home", "recent", "bookmark", "note", "digest"].indexOf(
        this.props.mode
      ),
      isCollapse: true,
      shelfIndex: null
    };
  }
  handleSidebar = (mode, index) => {
    console.log(index);
    this.setState({ index: index });
    this.setState({ shelfIndex: null });
    this.setState({ isCollapse: true });
    this.props.handleMode(mode);
    this.props.handleShelfIndex(null);
  };
  handleShelf = () => {
    this.setState({ isCollapse: !this.state.isCollapse });
  };
  handleShelfItem = index => {
    console.log(index);
    this.setState({ shelfIndex: index });
    this.props.handleShelfIndex(index);
    this.props.handleMode("shelf");
  };
  render() {
    const renderSideMenu = () => {
      return sideMenu.map((item, index) => {
        return (
          <li
            key={item.name}
            className={
              this.state.index === index && this.state.shelfIndex === null
                ? "active side-menu-item"
                : "side-menu-item"
            }
            id={`sidebar-${item.icon}`}
            onClick={() => {
              this.handleSidebar(item.mode, index);
            }}
          >
            {this.state.index === index && this.state.shelfIndex === null ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            <div
              className={
                this.state.index === index && this.state.shelfIndex === null
                  ? "side-menu-selector active-selector"
                  : "side-menu-selector "
              }
            >
              <span
                className={
                  this.state.index === index && this.state.shelfIndex === null
                    ? `icon-${item.icon} side-menu-icon  active-icon`
                    : `icon-${item.icon} side-menu-icon`
                }
              ></span>

              {item.name}
            </div>
          </li>
        );
      });
    };
    const renderShelfList = () => {
      const shelfList = Object.keys(ShelfUtil.getShelf());
      // console.log(shelfList, "shelfList");
      //去除开头的新建书架
      shelfList.splice(0, 1);
      return shelfList.map((item, index) => {
        return (
          <li
            key={index}
            className={
              this.state.shelfIndex === index
                ? "shelf-list-item active-shelf "
                : "shelf-list-item"
            }
            onClick={() => {
              this.handleShelfItem(index);
            }}
          >
            {item}
          </li>
        );
      });
    };
    return (
      <div className="sidebar">
        <img
          src={
            process.env.NODE_ENV === "production"
              ? "assets/logo.jpg"
              : "/assets/logo.jpg"
          }
          alt=""
          className="logo"
        />
        <div className="side-menu-container-parent">
          <ul className="side-menu-container">
            {renderSideMenu()}
            <li className="side-menu-shelf">
              <div
                onClick={() => {
                  this.handleShelf();
                }}
              >
                <span className="icon-shelf"></span>
                {"我的书架"}
                <span
                  className={
                    this.state.isCollapse ? "icon-dropdown" : "icon-shangla"
                  }
                ></span>
              </div>
              <div className="shelf-list-container-parent">
                <ul
                  className="shelf-list-container"
                  style={this.state.isCollapse ? { display: "none" } : {}}
                >
                  {renderShelfList()}
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return { mode: state.sidebar.mode };
};
const actionCreator = { handleMode, handleShelfIndex };
Sidebar = connect(mapStateToProps, actionCreator)(Sidebar);
export default Sidebar;
