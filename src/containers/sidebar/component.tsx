import React from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
import { Trans } from "react-i18next";
import { SidebarProps, SidebarState } from "./interface";
import { withRouter } from "react-router-dom";
import OtherUtil from "../../utils/otherUtil";
class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props);
    this.state = {
      index: 0,
      hoverIndex: -1,
      isCollapsed: OtherUtil.getReaderConfig("isCollapsed") === "yes" || false,
    };
  }
  componentDidMount() {
    this.props.handleMode(
      document.URL.split("/").reverse()[0] === "empty"
        ? "home"
        : document.URL.split("/").reverse()[0]
    );
  }
  handleSidebar = (mode: string, index: number) => {
    this.setState({ index: index });
    this.props.history.push(`/manager/${mode}`);
    this.props.handleMode(mode);
    this.props.handleSearch(false);
    this.props.handleSortDisplay(false);
  };
  handleHover = (index: number) => {
    this.setState({ hoverIndex: index });
  };
  handleCollapse = (isCollapsed: boolean) => {
    this.setState({ isCollapsed });
    this.props.handleCollapse(isCollapsed);
    OtherUtil.setReaderConfig("isCollapsed", isCollapsed ? "yes" : "no");
  };
  render() {
    const renderSideMenu = () => {
      return sideMenu.map((item, index) => {
        return (
          <li
            key={item.name}
            className={
              this.state.index === index
                ? "active side-menu-item"
                : "side-menu-item"
            }
            id={`sidebar-${item.icon}`}
            onClick={() => {
              this.handleSidebar(item.mode, index);
            }}
            onDrop={() => {
              index === 1 && this.props.handleDragToLove(true);
              index === 5 && this.props.handleDragToDelete(true);
            }}
            onMouseEnter={() => {
              this.handleHover(index);
            }}
            onMouseLeave={() => {
              this.handleHover(-1);
            }}
            style={this.state.isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          >
            {this.state.index === index ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            {this.state.hoverIndex === index ? (
              <div className="side-menu-hover-container"></div>
            ) : null}
            <div
              className={
                this.state.index === index
                  ? "side-menu-selector active-selector"
                  : "side-menu-selector "
              }
            >
              <div className="side-menu-icon">
                <span
                  className={
                    this.state.index === index
                      ? `icon-${item.icon}  active-icon`
                      : `icon-${item.icon}`
                  }
                  style={this.state.isCollapsed ? { marginLeft: "-25px" } : {}}
                ></span>
              </div>

              <span style={this.state.isCollapsed ? { display: "none" } : {}}>
                <Trans>{item.name}</Trans>
              </span>

              <p
                style={
                  this.state.isCollapsed ? { display: "none" } : { opacity: 0 }
                }
              >
                test
              </p>
            </div>
          </li>
        );
      });
    };
    return (
      <div className="sidebar">
        <div
          className="sidebar-list-icon"
          onClick={() => {
            this.handleCollapse(!this.state.isCollapsed);
          }}
        >
          <span className="icon-list sidebar-list"></span>
        </div>

        <img
          src={
            process.env.NODE_ENV === "production"
              ? "./assets/logo.png"
              : "../../assets/logo.png"
          }
          alt=""
          className="logo"
        />
        <div className="side-menu-container-parent">
          <ul className="side-menu-container">{renderSideMenu()}</ul>
        </div>
      </div>
    );
  }
}

export default withRouter(Sidebar);
