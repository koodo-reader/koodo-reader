import React from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
import { SidebarProps, SidebarState } from "./interface";
import { withRouter } from "react-router-dom";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import { openExternalUrl } from "../../utils/serviceUtils/urlUtil";
import ShelfUtil from "../../utils/readUtils/shelfUtil";
import DeletePopup from "../../components/dialogs/deletePopup";
import { Trans } from "react-i18next";
class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props);
    this.state = {
      index: 0,
      hoverIndex: -1,
      hoverShelfIndex: -1,
      isCollpaseShelf: false,
      isOpenDelete: false,
      shelfIndex: 0,
      isCollapsed:
        StorageUtil.getReaderConfig("isCollapsed") === "yes" || false,
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
    this.props.handleSelectBook(false);
    this.props.history.push(`/manager/${mode}`);
    this.props.handleMode(mode);
    this.props.handleShelfIndex(-1);
    this.props.handleSearch(false);
    this.props.handleSortDisplay(false);
  };
  handleHover = (index: number) => {
    this.setState({ hoverIndex: index });
  };
  handleShelfHover = (index: number) => {
    this.setState({ hoverShelfIndex: index });
  };
  handleCollapse = (isCollapsed: boolean) => {
    this.setState({ isCollapsed });
    this.props.handleCollapse(isCollapsed);
    StorageUtil.setReaderConfig("isCollapsed", isCollapsed ? "yes" : "no");
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  handleDeleteShelf = () => {
    if (this.state.shelfIndex < 1) return;
    let shelfTitles = Object.keys(ShelfUtil.getShelf());
    let currentShelfTitle = shelfTitles[this.state.shelfIndex];
    ShelfUtil.removeShelf(currentShelfTitle);
    this.setState({ shelfIndex: 0 }, () => {
      this.props.handleShelfIndex(0);
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
              this.state.index === index && this.props.mode !== "shelf"
                ? "active side-menu-item"
                : "side-menu-item"
            }
            id={`sidebar-${item.icon}`}
            onClick={() => {
              this.handleSidebar(item.mode, index);
            }}
            onMouseEnter={() => {
              this.handleHover(index);
            }}
            onMouseLeave={() => {
              this.handleHover(-1);
            }}
            style={this.props.isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          >
            {this.state.index === index && this.props.mode !== "shelf" ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            {this.state.hoverIndex === index ? (
              <div className="side-menu-hover-container"></div>
            ) : null}
            <div
              className={
                this.state.index === index && this.props.mode !== "shelf"
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
                    this.state.index === index && this.props.mode !== "shelf"
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
      let shelfList = ShelfUtil.getShelf();
      let shelfTitle = Object.keys(shelfList);

      return shelfTitle.map((item, index) => {
        return (
          <li
            key={item}
            className={
              this.props.shelfIndex === index
                ? "active side-menu-item"
                : "side-menu-item"
            }
            id={`sidebar-${index}`}
            onClick={() => {
              this.props.handleShelfIndex(index);
              if (index > 0) {
                this.props.handleMode("shelf");
              } else {
                this.props.handleMode("home");
              }
              this.setState({ index: -1 });
              this.props.history.push("/manager/shelf");
            }}
            onMouseEnter={() => {
              this.handleShelfHover(index);
            }}
            onMouseLeave={() => {
              this.handleShelfHover(-1);
            }}
            style={
              index === 0
                ? { display: "none" }
                : this.props.isCollapsed
                ? { width: 40, marginLeft: 15 }
                : {}
            }
          >
            {this.props.shelfIndex === index ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            {this.state.hoverShelfIndex === index ? (
              <div className="side-menu-hover-container"></div>
            ) : null}
            <div
              className={
                this.props.shelfIndex === index
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
                    this.props.shelfIndex === index
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
      name: Object.keys(ShelfUtil.getShelf())[this.state.shelfIndex],
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
              StorageUtil.getReaderConfig("appSkin") === "night" ||
              (StorageUtil.getReaderConfig("appSkin") === "system" &&
                StorageUtil.getReaderConfig("isOSNight") === "yes")
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
