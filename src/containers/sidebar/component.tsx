import React, { useCallback, useEffect, useRef, useState } from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
import { SidebarProps, SidebarState } from "./interface";
import { withRouter } from "react-router-dom";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { getWebsiteUrl, openInBrowser } from "../../utils/common";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import logoDark from "../../assets/images/logo-dark.png";
import logoDarkPro from "../../assets/images/logo-dark-pro.png";
import logoLight from "../../assets/images/logo-light.png";
import logoLightPro from "../../assets/images/logo-light-pro.png";
import {
  addBooksToFavorite,
  addBooksToShelf,
  isBookDragEvent,
  moveBooksToTrash,
  parseBookDragData,
} from "../../utils/reader/bookDrag";

const Sidebar = (props: SidebarProps) => {
  const [state, setState] = useState<SidebarState>(() => ({
    hoverMode: "",
    hoverShelfTitle: "",
    isCollpaseShelf: false,
    isCollapsed:
      ConfigService.getReaderConfig("isCollapsed") === "yes" || false,
    isCreateShelf: false,
    newShelfName: "",
    dropTargetShelf: "",
  }));
  const newShelfInput = useRef<HTMLInputElement>(null);
  const prevIsOpenSortShelfDialog = useRef(props.isOpenSortShelfDialog);

  const handleDocumentDragEnd = useCallback(() => {
    setState((prev) => ({ ...prev, dropTargetShelf: "" }));
  }, []);

  useEffect(() => {
    props.handleMode(
      document.URL.split("/").reverse()[0] === "empty"
        ? "home"
        : document.URL.split("/").reverse()[0]
    );
    document.addEventListener("dragend", handleDocumentDragEnd);
    return () => {
      document.removeEventListener("dragend", handleDocumentDragEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Focus the input when isCreateShelf changes from false to true
    if (state.isCreateShelf && newShelfInput.current) {
      newShelfInput.current.focus();
    }
  }, [state.isCreateShelf]);

  useEffect(() => {
    // check for isOpenSortShelfDialog update the component
    if (prevIsOpenSortShelfDialog.current !== props.isOpenSortShelfDialog) {
      prevIsOpenSortShelfDialog.current = props.isOpenSortShelfDialog;
      setState((prev) => ({
        ...prev,
        isCreateShelf: false,
        newShelfName: "",
      }));
    }
  }, [props.isOpenSortShelfDialog]);

  const handleSidebar = (mode: string) => {
    props.handleSelectBook(false);
    props.history.push(`/manager/${mode}`);
    props.handleMode(mode);
    props.handleShelf("");
    props.handleSearch(false);
    props.handleSortDisplay(false);
  };
  const handleHover = (mode: string) => {
    setState((prev) => ({ ...prev, hoverMode: mode }));
  };
  const handleShelfHover = (hoverShelfTitle: string) => {
    setState((prev) => ({ ...prev, hoverShelfTitle }));
  };
  const handleCollapse = (isCollapsed: boolean) => {
    setState((prev) => ({ ...prev, isCollapsed }));
    props.handleCollapse(isCollapsed);
    ConfigService.setReaderConfig("isCollapsed", isCollapsed ? "yes" : "no");
  };
  const handleJump = (url: string) => {
    openInBrowser(url);
  };
  const handleCreateShelf = () => {
    if (!state.newShelfName) {
      toast(props.t("Shelf Title is Empty"));
      setState((prev) => ({
        ...prev,
        isCreateShelf: false,
        newShelfName: "",
      }));
      return;
    }
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    if (shelfList.hasOwnProperty(state.newShelfName)) {
      toast(props.t("Duplicate shelf"));
      return;
    }
    ConfigService.setListConfig(state.newShelfName, "sortedShelfList");

    ConfigService.setOneMapConfig(state.newShelfName, [], "shelfList");
    toast.success(props.t("Created successfully"));
    setState((prev) => ({
      ...prev,
      isCreateShelf: false,
      newShelfName: "",
    }));
  };
  const handleBookDrop = (shelfTitle: string, event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setState((prev) => ({ ...prev, dropTargetShelf: "" }));
    if (!isBookDragEvent(event)) return;

    const bookKeys = parseBookDragData(event);
    if (bookKeys.length === 0) return;

    const added = addBooksToShelf(bookKeys, shelfTitle);
    if (added === 0) {
      toast(props.t("Duplicate book"));
      return;
    }
    toast.success(props.t("Addition successful"));
    props.handleFetchBooks();
    props.handleShelf(shelfTitle);
    props.handleMode("shelf");
    props.history.push("/manager/shelf");
  };
  const handleFavoriteDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setState((prev) => ({ ...prev, dropTargetShelf: "" }));
    if (!isBookDragEvent(event)) return;

    const bookKeys = parseBookDragData(event);
    if (bookKeys.length === 0) return;

    const added = addBooksToFavorite(bookKeys);
    if (added === 0) {
      toast(props.t("Duplicate book"));
      return;
    }
    toast.success(props.t("Addition successful"));
    props.handleFetchBooks();
    props.handleShelf("");
    props.handleMode("favorite");
    props.history.push("/manager/favorite");
  };
  const handleTrashDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setState((prev) => ({ ...prev, dropTargetShelf: "" }));
    if (!isBookDragEvent(event)) return;

    const bookKeys = parseBookDragData(event);
    if (bookKeys.length === 0) return;

    const moved = moveBooksToTrash(bookKeys);
    if (moved === 0) {
      toast(props.t("Duplicate book in trash bin"));
      return;
    }
    toast.success(props.t("Deletion successful"));
    props.handleFetchBooks();
    props.handleShelf("");
    props.handleMode("trash");
    props.history.push("/manager/trash");
  };
  const getBookDragHandlers = (
    targetId: string,
    onDrop: (event: React.DragEvent) => void
  ) => ({
    onDragEnter: (event: React.DragEvent) => {
      if (isBookDragEvent(event)) {
        event.preventDefault();
        setState((prev) => ({ ...prev, dropTargetShelf: targetId }));
      }
    },
    onDragLeave: (event: React.DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setState((prev) => ({ ...prev, dropTargetShelf: "" }));
      }
    },
    onDragOver: (event: React.DragEvent) => {
      if (isBookDragEvent(event)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    },
    onDrop,
  });
  const isBookDropTarget = (mode: string) =>
    mode === "favorite" || mode === "trash";

  const renderSideMenu = () => {
    return sideMenu.map((item) => {
      const isDropTarget = isBookDropTarget(item.mode);
      return (
        <li
          key={item.name}
          className={
            (props.mode === item.mode
              ? "active side-menu-item"
              : "side-menu-item") +
            (state.dropTargetShelf === item.mode ? " shelf-drop-target" : "")
          }
          id={`sidebar-${item.icon}`}
          onClick={() => {
            handleSidebar(item.mode);
          }}
          onMouseEnter={() => {
            handleHover(item.mode);
          }}
          onMouseLeave={() => {
            handleHover("");
          }}
          style={props.isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          {...(isDropTarget
            ? getBookDragHandlers(
                item.mode,
                item.mode === "favorite"
                  ? handleFavoriteDrop
                  : handleTrashDrop
              )
            : {})}
        >
          {props.mode === item.mode ? (
            <div className="side-menu-selector-container"></div>
          ) : null}
          {state.hoverMode === item.mode ? (
            <div className="side-menu-hover-container"></div>
          ) : null}
          <div
            className={
              props.mode === item.mode
                ? "side-menu-selector active-selector"
                : "side-menu-selector "
            }
          >
            <div
              className="side-menu-icon"
              style={props.isCollapsed ? {} : { marginLeft: "38px" }}
            >
              <span
                className={
                  props.mode === item.mode
                    ? `icon-${item.icon}  active-icon`
                    : `icon-${item.icon}`
                }
                style={
                  props.isCollapsed
                    ? { position: "relative", marginLeft: "-9px" }
                    : {}
                }
              ></span>
            </div>

            <span
              style={
                props.isCollapsed
                  ? { display: "none", width: "70%" }
                  : { width: "60%" }
              }
            >
              {props.t(item.name)}
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
    let isShowShelfBookCount =
      ConfigService.getReaderConfig("isShowShelfBookCount") === "yes";

    return Array.from(new Set([...sortedShelfList, ...shelfTitleList])).map(
      (item, index) => {
        const shelfBookCount = Array.isArray(shelfList[item])
          ? shelfList[item].length
          : 0;
        return (
          <li
            key={item}
            className={
              (props.shelfTitle === item
                ? "active side-menu-item"
                : "side-menu-item") +
              (state.dropTargetShelf === item ? " shelf-drop-target" : "")
            }
            id={`sidebar-${index}`}
            onClick={() => {
              props.handleShelf(item);
              props.handleMode("shelf");
              props.history.push("/manager/shelf");
            }}
            {...getBookDragHandlers(item, (event) => {
              handleBookDrop(item, event);
            })}
            onMouseEnter={() => {
              handleShelfHover(item);
            }}
            onMouseLeave={() => {
              handleShelfHover("");
            }}
            style={props.isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          >
            {props.shelfTitle === item ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            {state.hoverShelfTitle === item ? (
              <div className="side-menu-hover-container"></div>
            ) : null}
            <div
              className={
                props.shelfTitle === item
                  ? "side-menu-selector active-selector"
                  : "side-menu-selector "
              }
            >
              <div
                className="side-menu-icon"
                style={props.isCollapsed ? {} : { marginLeft: "38px" }}
              >
                <span data-tooltip-id="my-tooltip" data-tooltip-content={item}>
                  <span
                    className={
                      props.shelfTitle === item
                        ? `icon-bookshelf-line  active-icon sidebar-shelf-icon`
                        : `icon-bookshelf-line sidebar-shelf-icon`
                    }
                    style={
                      props.isCollapsed
                        ? { position: "relative", marginLeft: "-8px" }
                        : {}
                    }
                  ></span>
                </span>
              </div>

              <span
                className="sidebar-shelf-content"
                style={
                  props.isCollapsed ? { display: "none", width: "70%" } : {}
                }
              >
                <span className="sidebar-shelf-name">{props.t(item)}</span>
                {isShowShelfBookCount && (
                  <span className="sidebar-shelf-count">{shelfBookCount}</span>
                )}
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
            handleCollapse(!state.isCollapsed);
          }}
        >
          <span className="icon-menu sidebar-list"></span>
        </div>

        <img
          src={
            ConfigService.getReaderConfig("appSkin") === "night" ||
            (ConfigService.getReaderConfig("appSkin") === "system" &&
              ConfigService.getReaderConfig("isOSNight") === "yes")
              ? props.isAuthed
                ? logoDarkPro
                : logoDark
              : props.isAuthed
              ? logoLightPro
              : logoLight
          }
          alt=""
          onClick={() => {
            handleJump(getWebsiteUrl());
          }}
          style={state.isCollapsed ? { display: "none" } : {}}
          className="logo"
        />
        <div
          className="side-menu-container-parent"
          style={state.isCollapsed ? { width: "70px" } : {}}
        >
          <ul className="side-menu-container">{renderSideMenu()}</ul>
          <div
            className="side-shelf-title-container"
            style={
              state.isCollapsed
                ? { display: "none" }
                : state.isCollpaseShelf
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
                setState((prev) => ({
                  ...prev,
                  isCollpaseShelf: !prev.isCollpaseShelf,
                }));
              }}
              style={
                state.isCollpaseShelf ? { transform: "rotate(-90deg)" } : {}
              }
            ></span>
          </div>
          {props.isCollapsed ? null : !state.isCreateShelf ? (
            <div className={"side-menu-selector"} style={{ cursor: "pointer" }}>
              <div
                className="side-menu-icon"
                style={{
                  borderRadius: "5px",
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                  padding: "4px 0px",
                  width: "24px",
                  height: "14px",
                  marginLeft: "20px",
                  marginRight: "15px",
                }}
              >
                <span
                  className={`icon-add sidebar-shelf-icon`}
                  style={{ fontSize: "11px" }}
                ></span>
              </div>

              <span
                style={
                  props.isCollapsed
                    ? { display: "none", width: "70%" }
                    : { width: "60%" }
                }
                onClick={() => {
                  setState((prev) => ({ ...prev, isCreateShelf: true }));
                }}
              >
                {props.t("New shelf")}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <input
                ref={newShelfInput}
                type="text"
                name="newShelf"
                id="sidebar-new-shelf"
                className="tag-list-item-new"
                onChange={(event) => {
                  // Remove special characters from the shelf name
                  const sanitizedValue = event.target.value.replace(
                    /[\[\]{}",:\/\\|<>*?]/g,
                    ""
                  );
                  setState((prev) => ({
                    ...prev,
                    newShelfName: sanitizedValue,
                  }));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCreateShelf();
                  }
                }}
              />
              <span
                className={`icon-check sidebar-shelf-icon`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleCreateShelf();
                }}
                style={{
                  cursor: "pointer",
                  marginRight: "30px",
                  marginTop: "5px",
                }}
              ></span>
            </div>
          )}
          {!props.isCollapsed && (
            <div
              className={"side-menu-selector"}
              style={{ cursor: "pointer" }}
              onClick={() => {
                props.handleSortShelfDialog(true);
              }}
            >
              <div
                className="side-menu-icon"
                style={{
                  borderRadius: "5px",
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                  padding: "4px 0px",
                  width: "24px",
                  height: "14px",
                  marginLeft: "20px",
                  marginRight: "15px",
                }}
              >
                <span
                  className={`icon-edit-line sidebar-shelf-icon`}
                  style={{ fontSize: "17px" }}
                ></span>
              </div>

              <span
                style={
                  props.isCollapsed
                    ? { display: "none", width: "70%" }
                    : { width: "60%" }
                }
              >
                {props.t("Manage shelf")}
              </span>
            </div>
          )}
          {!state.isCollpaseShelf && (
            <ul className="side-shelf-container">{renderSideShelf()}</ul>
          )}
        </div>
        {/* Stats button at the bottom */}
        <div className="side-menu-about" style={{ paddingBottom: 8 }}>
          <div
            className={"side-menu-selector"}
            style={{ cursor: "pointer" }}
            onClick={() => {
              props.history.push("/stats");
            }}
          >
            <div
              className="side-menu-icon"
              style={
                props.isCollapsed
                  ? {}
                  : { marginLeft: "20px", marginRight: "15px" }
              }
            >
              <span
                className="icon-chart sidebar-shelf-icon"
                style={
                  props.isCollapsed
                    ? {
                        position: "relative",
                        marginLeft: "-0px",
                        fontSize: 14,
                      }
                    : { fontSize: 14 }
                }
              ></span>
            </div>
            <span
              style={
                props.isCollapsed
                  ? { display: "none", width: "70%" }
                  : { width: "61%" }
              }
            >
              {props.t("Reading Stats")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default withRouter(Sidebar as any);
