import React from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
import { SidebarProps, SidebarState } from "./interface";
import { withRouter } from "react-router-dom";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { openExternalUrl, WEBSITE_URL } from "../../utils/common";
import DeletePopup from "../../components/dialogs/deletePopup";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
class Sidebar extends React.Component<SidebarProps, SidebarState> {
  private newShelfInput = React.createRef<HTMLInputElement>();
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
      isCreateShelf: false,
      newShelfName: "",
    };
  }
  componentDidMount() {
    this.props.handleMode(
      document.URL.split("/").reverse()[0] === "empty"
        ? "home"
        : document.URL.split("/").reverse()[0]
    );
  }
  componentDidUpdate(prevProps: SidebarProps, prevState: SidebarState) {
    // Focus the input when isCreateShelf changes from false to true
    if (
      !prevState.isCreateShelf &&
      this.state.isCreateShelf &&
      this.newShelfInput.current
    ) {
      this.newShelfInput.current.focus();
    }
    // check for isOpenSortShelfDialog update the component
    if (prevProps.isOpenSortShelfDialog !== this.props.isOpenSortShelfDialog) {
      this.setState({ isCreateShelf: false, newShelfName: "" });
    }
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
  handleCreateShelf = () => {
    if (!this.state.newShelfName) {
      toast(this.props.t("Shelf Title is Empty"));
      this.setState({ isCreateShelf: false, newShelfName: "" });
      return;
    }
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    if (shelfList.hasOwnProperty(this.state.newShelfName)) {
      toast(this.props.t("Duplicate shelf"));
      return;
    }
    ConfigService.setListConfig(this.state.newShelfName, "sortedShelfList");

    ConfigService.setOneMapConfig(this.state.newShelfName, [], "shelfList");
    toast.success(this.props.t("Created successfully"));
    this.setState({ isCreateShelf: false, newShelfName: "" });
  };
  render() {
    const renderSideMenu = () => {
      return sideMenu.map((item) => {
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
      let sortedShelfList =
        ConfigService.getAllListConfig("sortedShelfList") || [];
      let shelfList = ConfigService.getAllMapConfig("shelfList");
      let shelfTitleList = Object.keys(shelfList);

      return Array.from(new Set([...sortedShelfList, ...shelfTitleList])).map(
        (item, index) => {
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
              style={
                this.props.isCollapsed ? { width: 40, marginLeft: 15 } : {}
              }
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
        }
      );
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
                ? require(`../../assets/images/logo-dark${
                    this.props.isAuthed ? "-pro" : ""
                  }.png`)
                : require(`../../assets/images/logo-light${
                    this.props.isAuthed ? "-pro" : ""
                  }.png`)
            }
            alt=""
            onClick={() => {
              this.handleJump(WEBSITE_URL);
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
            {!this.state.isCreateShelf ? (
              <div
                className={"side-menu-selector"}
                style={{ cursor: "pointer" }}
              >
                <div
                  className="side-menu-icon"
                  style={{
                    borderRadius: "5px",
                    backgroundColor: "rgba(0, 0, 0, 0.06)",
                    padding: "4px 0px",
                    width: "24px",
                  }}
                >
                  <span
                    className={`icon-add sidebar-shelf-icon`}
                    style={{ fontSize: "11px" }}
                  ></span>
                </div>

                <span
                  style={
                    this.props.isCollapsed
                      ? { display: "none", width: "70%" }
                      : { width: "60%" }
                  }
                  onClick={() => {
                    this.setState({ isCreateShelf: true });
                  }}
                >
                  {this.props.t("New shelf")}
                </span>
              </div>
            ) : (
              <div>
                <input
                  ref={this.newShelfInput}
                  type="text"
                  name="newShelf"
                  id="sidebar-new-shelf"
                  className="tag-list-item-new"
                  onChange={(event) => {
                    this.setState({ newShelfName: event.target.value });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      this.handleCreateShelf();
                    }
                  }}
                  onBlur={() => {
                    this.setState({ isCreateShelf: false, newShelfName: "" });
                  }}
                />
                <span
                  className={`icon-check sidebar-shelf-icon`}
                  onClick={(event) => {
                    event.stopPropagation();
                    this.handleCreateShelf();
                  }}
                  style={{ cursor: "pointer" }}
                ></span>
              </div>
            )}
            <div
              className={"side-menu-selector"}
              style={{ cursor: "pointer" }}
              onClick={() => {
                this.props.handleSortShelfDialog(true);
              }}
            >
              <div
                className="side-menu-icon"
                style={{
                  borderRadius: "5px",
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                  padding: "4px 0px",
                  width: "24px",
                }}
              >
                <span
                  className={`icon-edit-line sidebar-shelf-icon`}
                  style={{ fontSize: "17px" }}
                ></span>
              </div>

              <span
                style={
                  this.props.isCollapsed
                    ? { display: "none", width: "70%" }
                    : { width: "60%" }
                }
              >
                {this.props.t("Edit shelf")}
              </span>
            </div>
            {!this.state.isCollpaseShelf && (
              <ul className="side-shelf-container">{renderSideShelf()}</ul>
            )}
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(Sidebar as any);
