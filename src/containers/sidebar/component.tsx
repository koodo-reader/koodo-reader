import React from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
import { SidebarProps, SidebarState } from "./interface";
import { withRouter } from "react-router-dom";
import OtherUtil from "../../utils/otherUtil";
import { Tooltip } from "react-tippy";
import { isElectron } from "react-device-detect";

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
  handleJump = (url: string) => {
    isElectron
      ? window.require("electron").shell.openExternal(url)
      : window.open(url);
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
            style={this.props.isCollapsed ? { width: 40, marginLeft: 15 } : {}}
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
              <Tooltip
                title={this.props.t(item.name)}
                position="top"
                trigger="mouseenter"
              >
                <div
                  className="side-menu-icon"
                  style={this.props.isCollapsed ? {} : { marginLeft: "38px" }}
                >
                  <span
                    className={
                      this.state.index === index
                        ? `icon-${item.icon}  active-icon`
                        : `icon-${item.icon}`
                    }
                    style={
                      this.props.isCollapsed ? { marginLeft: "-25px" } : {}
                    }
                  ></span>
                </div>
              </Tooltip>
              <span style={this.props.isCollapsed ? { display: "none" } : {}}>
                {this.props.t(item.name)}
              </span>
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
          <Tooltip
            title={this.props.t(
              this.props.isCollapsed ? "Show sidebar" : "Collapse sidebar"
            )}
            position="top"
            trigger="mouseenter"
            distance={25}
          >
            <span className="icon-menu sidebar-list"></span>
          </Tooltip>
        </div>

        <img
          src={
            OtherUtil.getReaderConfig("isDisplayDark") === "yes"
              ? "./assets/label_light.png"
              : "./assets/label.png"
          }
          alt=""
          onClick={() => {
            this.handleJump("https://koodo.960960.xyz");
          }}
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
