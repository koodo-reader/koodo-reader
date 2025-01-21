import React from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
import { SidebarProps, SidebarState } from "./interface";
import { withRouter } from "react-router-dom";
import ConfigService from "../../utils/storage/configService";
import { openExternalUrl } from "../../utils/common";
import DeletePopup from "../../components/dialogs/deletePopup";
import { Trans } from "react-i18next";
class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props);
    this.state = {
      mode: "home",
      hoverMode: "",
      hoverShelfTitle: "",
      isCollpaseShelf: false,
      isOpenDelete: false,
      shelfTitle: "",
      isCollapsed:
        ConfigService.getReaderConfig("isCollapsed") === "yes" || false,
    };
  }
  componentDidMount() {
    this.props.handleMode(
      document.URL.split("/").reverse()[0] === "empty"
        ? "home"
        : document.URL.split("/").reverse()[0]
    );
  }
  handleSidebar = (mode: string) => {
    this.setState({ mode: mode });
    this.props.handleSelectBook(false);
    this.props.history.push(`/manager/${mode}`);
    this.props.handleMode(mode);
    this.props.handleShelf("");
    this.props.handleSearch(false);
    this.props.handleSortDisplay(false);
  };
  handleHover = (mode: string) => {
    this.setState({ hoverMode: mode });
  };
  handleShelfHover = (hoverShelfTitle: string) => {
    this.setState({ hoverShelfTitle });
  };
  handleCollapse = (isCollapsed: boolean) => {
    this.setState({ isCollapsed });
    this.props.handleCollapse(isCollapsed);
    ConfigService.setReaderConfig("isCollapsed", isCollapsed ? "yes" : "no");
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  handleDeleteShelf = () => {
    if (!this.state.shelfTitle) return;
    let currentShelfTitle = this.state.shelfTitle;
    ConfigService.deleteMapConfig(currentShelfTitle, "shelfList");
    this.setState({ shelfTitle: "" }, () => {
      this.props.handleShelf("");
      this.props.handleMode("shelf");
    });
  };
  handleDeletePopup = (isOpenDelete: boolean) => {
    this.setState({ isOpenDelete });
  };
  render() {
    const renderSideMenu = () => {
      return sideMenu.map((item, index) => {
        return (
          <li
            key={item.name}
            className={
              this.props.mode === item.mode
                ? "active side-menu-item"
                : "side-menu-item"
            }
            id={`sidebar-${item.icon}`}
            onClick={() => {
              this.handleSidebar(item.mode);
            }}
            onMouseEnter={() => {
              this.handleHover(item.mode);
            }}
            onMouseLeave={() => {
              this.handleHover("");
            }}
            style={this.props.isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          >
            {this.props.mode === item.mode ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            {this.state.hoverMode === item.mode ? (
              <div className="side-menu-hover-container"></div>
            ) : null}
            <div
              className={
                this.props.mode === item.mode
                  ? "side-menu-selector active-selector"
                  : "side-menu-selector "
              }
            >
              <div
                className="side-menu-icon"
                style={this.props.isCollapsed ? {} : { marginLeft: "38px" }}
              >
                <span
                  className={
                    this.props.mode === item.mode
                      ? `icon-${item.icon}  active-icon`
                      : `icon-${item.icon}`
                  }
                  style={
                    this.props.isCollapsed
                      ? { position: "relative", marginLeft: "-9px" }
                      : {}
                  }
                ></span>
              </div>

              <span
                style={
                  this.props.isCollapsed
                    ? { display: "none", width: "70%" }
                    : { width: "60%" }
                }
              >
                {this.props.t(item.name)}
              </span>
            </div>
          </li>
        );
      });
    };
    const renderSideShelf = () => {
      let shelfList = ConfigService.getAllMapConfig("shelfList");
      let shelfTitle = Object.keys(shelfList);

      return shelfTitle.map((item, index) => {
        return (
          <li
            key={item}
            className={
              this.props.shelfTitle === item
                ? "active side-menu-item"
                : "side-menu-item"
            }
            id={`sidebar-${index}`}
            onClick={() => {
              this.props.handleShelf(item);
              this.props.handleMode("shelf");
              this.setState({ mode: "" });
              this.props.history.push("/manager/shelf");
            }}
            onMouseEnter={() => {
              this.handleShelfHover(item);
            }}
            onMouseLeave={() => {
              this.handleShelfHover("");
            }}
            style={this.props.isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          >
            {this.props.shelfTitle === item ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            {this.state.hoverShelfTitle === item ? (
              <div className="side-menu-hover-container"></div>
            ) : null}
            <div
              className={
                this.props.shelfTitle === item
                  ? "side-menu-selector active-selector"
                  : "side-menu-selector "
              }
            >
              <div
                className="side-menu-icon"
                style={this.props.isCollapsed ? {} : { marginLeft: "38px" }}
              >
                <span
                  className={
                    this.props.shelfTitle === item
                      ? `icon-bookshelf-line  active-icon sidebar-shelf-icon`
                      : `icon-bookshelf-line sidebar-shelf-icon`
                  }
                  style={
                    this.props.isCollapsed
                      ? { position: "relative", marginLeft: "-8px" }
                      : {}
                  }
                ></span>
              </div>

              <span
                style={
                  this.props.isCollapsed
                    ? { display: "none", width: "70%" }
                    : { width: "60%" }
                }
              >
                {this.props.t(item)}
              </span>
            </div>
          </li>
        );
      });
    };
    const deletePopupProps = {
      mode: "shelf",
      name: this.state.shelfTitle,
      title: "Delete this shelf",
      description: "This action will clear and remove this shelf",
      handleDeletePopup: this.handleDeletePopup,
      handleDeleteOpearion: this.handleDeleteShelf,
    };
    return (
      <>
        <div className="sidebar">
          <div
            className="sidebar-list-icon"
            onClick={() => {
              this.handleCollapse(!this.state.isCollapsed);
            }}
          >
            <span className="icon-menu sidebar-list"></span>
          </div>

          <img
            src={
              ConfigService.getReaderConfig("appSkin") === "night" ||
              (ConfigService.getReaderConfig("appSkin") === "system" &&
                ConfigService.getReaderConfig("isOSNight") === "yes")
                ? "./assets/label_light.png"
                : "./assets/label.png"
            }
            alt=""
            onClick={() => {
              this.handleJump("https://koodoreader.com");
            }}
            style={this.state.isCollapsed ? { display: "none" } : {}}
            className="logo"
          />
          <div
            className="side-menu-container-parent"
            style={this.state.isCollapsed ? { width: "70px" } : {}}
          >
            <ul className="side-menu-container">{renderSideMenu()}</ul>
            <div
              className="side-shelf-title-container"
              style={
                this.state.isCollapsed
                  ? { display: "none" }
                  : this.state.isCollpaseShelf
                  ? {}
                  : { border: "none" }
              }
            >
              <div className="side-shelf-title">
                <Trans>Shelf</Trans>
              </div>
              <span
                className="icon-dropdown side-shelf-title-icon"
                onClick={() => {
                  this.setState({
                    isCollpaseShelf: !this.state.isCollpaseShelf,
                  });
                }}
                style={
                  this.state.isCollpaseShelf
                    ? { transform: "rotate(-90deg)" }
                    : {}
                }
              ></span>
            </div>

            {!this.state.isCollpaseShelf && (
              <ul className="side-shelf-container">{renderSideShelf()}</ul>
            )}
          </div>
        </div>
        {this.state.isOpenDelete && <DeletePopup {...deletePopupProps} />}
      </>
    );
  }
}

export default withRouter(Sidebar as any);
