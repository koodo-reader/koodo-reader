import React from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
import { Trans } from "react-i18next";
import { SidebarProps, SidebarState } from "./interface";
import { withRouter } from "react-router-dom";

class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props);
    this.state = {
      index: [
        "home",
        "favorite",
        "bookmark",
        "note",
        "digest",
        "trash",
      ].indexOf(
        document.URL.split("/").reverse()[0] === "empty"
          ? "home"
          : document.URL.split("/").reverse()[0]
      ),
      isCollapse: true,
      shelfIndex: -1,
    };
  }
  handleSidebar = (mode: string, index: number) => {
    this.setState({ index: index });
    this.setState({ shelfIndex: -1 });
    this.setState({ isCollapse: true });
    this.props.history.push(`/manager/${mode}`);
    this.props.handleMode(mode);
    this.props.handleSearch(false);
  };
  render() {
    const renderSideMenu = () => {
      return sideMenu.map((item, index) => {
        return (
          <li
            key={item.name}
            className={
              this.state.index === index && this.state.shelfIndex === -1
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
              console.log("drag");
            }}
          >
            {this.state.index === index && this.state.shelfIndex === -1 ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            <div
              className={
                this.state.index === index && this.state.shelfIndex === -1
                  ? "side-menu-selector active-selector"
                  : "side-menu-selector "
              }
            >
              <span
                className={
                  this.state.index === index && this.state.shelfIndex === -1
                    ? `icon-${item.icon} side-menu-icon  active-icon`
                    : `icon-${item.icon} side-menu-icon`
                }
              ></span>
              <Trans>{item.name}</Trans>
            </div>
          </li>
        );
      });
    };
    return (
      <div className="sidebar">
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
