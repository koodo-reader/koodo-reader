import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./sidebar.css";
import { sideMenu } from "../../constants/sideMenu";
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
import { useAppStore } from "../../store/useAppStore";

export interface SidebarState {
  hoverMode: string;
  hoverShelfTitle: string;
  isCollpaseShelf: boolean;

  newShelfName: string;

  isCreateShelf: boolean;
  dropTargetShelf: string;
}

const Sidebar = () => {
  const mode = useAppStore((s) => s.sidebar.mode);
  const isCollapsed = useAppStore((s) => s.sidebar.isCollapsed);
  const shelfTitle = useAppStore((s) => s.sidebar.shelfTitle);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const isOpenSortShelfDialog = useAppStore(
    (s) => s.backupPage.isOpenSortShelfDialog
  );
  const handleMode = useAppStore((s) => s.handleMode);
  const handleSearch = useAppStore((s) => s.handleSearch);
  const handleSortDisplay = useAppStore((s) => s.handleSortDisplay);
  const handleCollapse = useAppStore((s) => s.handleCollapse);
  const handleSelectBook = useAppStore((s) => s.handleSelectBook);
  const handleShelf = useAppStore((s) => s.handleShelf);
  const handleSortShelfDialog = useAppStore((s) => s.handleSortShelfDialog);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const prevIsOpenSortShelfDialog = useRef(isOpenSortShelfDialog);

  const handleDocumentDragEnd = useCallback(() => {
    setState((prev) => ({ ...prev, dropTargetShelf: "" }));
  }, []);

  useEffect(() => {
    handleMode(
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
    if (prevIsOpenSortShelfDialog.current !== isOpenSortShelfDialog) {
      prevIsOpenSortShelfDialog.current = isOpenSortShelfDialog;
      setState((prev) => ({
        ...prev,
        isCreateShelf: false,
        newShelfName: "",
      }));
    }
  }, [isOpenSortShelfDialog]);

  const handleSidebar = (mode: string) => {
    handleSelectBook(false);
    navigate(`/manager/${mode}`);
    handleMode(mode);
    handleShelf("");
    handleSearch(false);
    handleSortDisplay(false);
  };
  const handleHover = (mode: string) => {
    setState((prev) => ({ ...prev, hoverMode: mode }));
  };
  const handleShelfHover = (hoverShelfTitle: string) => {
    setState((prev) => ({ ...prev, hoverShelfTitle }));
  };
  const handleCollapseSidebar = (isCollapsed: boolean) => {
    setState((prev) => ({ ...prev, isCollapsed }));
    handleCollapse(isCollapsed);
    ConfigService.setReaderConfig("isCollapsed", isCollapsed ? "yes" : "no");
  };
  const handleJump = (url: string) => {
    openInBrowser(url);
  };
  const handleCreateShelf = () => {
    if (!state.newShelfName) {
      toast(t("Shelf Title is Empty"));
      setState((prev) => ({
        ...prev,
        isCreateShelf: false,
        newShelfName: "",
      }));
      return;
    }
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    if (shelfList.hasOwnProperty(state.newShelfName)) {
      toast(t("Duplicate shelf"));
      return;
    }
    ConfigService.setListConfig(state.newShelfName, "sortedShelfList");

    ConfigService.setOneMapConfig(state.newShelfName, [], "shelfList");
    toast.success(t("Created successfully"));
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
      toast(t("Duplicate book"));
      return;
    }
    toast.success(t("Addition successful"));
    handleFetchBooks();
    handleShelf(shelfTitle);
    handleMode("shelf");
    navigate("/manager/shelf");
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
      toast(t("Duplicate book"));
      return;
    }
    toast.success(t("Addition successful"));
    handleFetchBooks();
    handleShelf("");
    handleMode("favorite");
    navigate("/manager/favorite");
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
      toast(t("Duplicate book in trash bin"));
      return;
    }
    toast.success(t("Deletion successful"));
    handleFetchBooks();
    handleShelf("");
    handleMode("trash");
    navigate("/manager/trash");
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
            (mode === item.mode
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
          style={isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          {...(isDropTarget
            ? getBookDragHandlers(
                item.mode,
                item.mode === "favorite"
                  ? handleFavoriteDrop
                  : handleTrashDrop
              )
            : {})}
        >
          {mode === item.mode ? (
            <div className="side-menu-selector-container"></div>
          ) : null}
          {state.hoverMode === item.mode ? (
            <div className="side-menu-hover-container"></div>
          ) : null}
          <div
            className={
              mode === item.mode
                ? "side-menu-selector active-selector"
                : "side-menu-selector "
            }
          >
            <div
              className="side-menu-icon"
              style={isCollapsed ? {} : { marginLeft: "38px" }}
            >
              <span
                className={
                  mode === item.mode
                    ? `icon-${item.icon}  active-icon`
                    : `icon-${item.icon}`
                }
                style={
                  isCollapsed
                    ? { position: "relative", marginLeft: "-9px" }
                    : {}
                }
              ></span>
            </div>

            <span
              style={
                isCollapsed
                  ? { display: "none", width: "70%" }
                  : { width: "60%" }
              }
            >
              {t(item.name)}
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
              (shelfTitle === item
                ? "active side-menu-item"
                : "side-menu-item") +
              (state.dropTargetShelf === item ? " shelf-drop-target" : "")
            }
            id={`sidebar-${index}`}
            onClick={() => {
              handleShelf(item);
              handleMode("shelf");
              navigate("/manager/shelf");
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
            style={isCollapsed ? { width: 40, marginLeft: 15 } : {}}
          >
            {shelfTitle === item ? (
              <div className="side-menu-selector-container"></div>
            ) : null}
            {state.hoverShelfTitle === item ? (
              <div className="side-menu-hover-container"></div>
            ) : null}
            <div
              className={
                shelfTitle === item
                  ? "side-menu-selector active-selector"
                  : "side-menu-selector "
              }
            >
              <div
                className="side-menu-icon"
                style={isCollapsed ? {} : { marginLeft: "38px" }}
              >
                <span data-tooltip-id="my-tooltip" data-tooltip-content={item}>
                  <span
                    className={
                      shelfTitle === item
                        ? `icon-bookshelf-line  active-icon sidebar-shelf-icon`
                        : `icon-bookshelf-line sidebar-shelf-icon`
                    }
                    style={
                      isCollapsed
                        ? { position: "relative", marginLeft: "-8px" }
                        : {}
                    }
                  ></span>
                </span>
              </div>

              <span
                className="sidebar-shelf-content"
                style={
                  isCollapsed ? { display: "none", width: "70%" } : {}
                }
              >
                <span className="sidebar-shelf-name">{t(item)}</span>
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
            handleCollapseSidebar(!isCollapsed);
          }}
        >
          <span className="icon-menu sidebar-list"></span>
        </div>

        <img
          src={
            ConfigService.getReaderConfig("appSkin") === "night" ||
            (ConfigService.getReaderConfig("appSkin") === "system" &&
              ConfigService.getReaderConfig("isOSNight") === "yes")
              ? isAuthed
                ? logoDarkPro
                : logoDark
              : isAuthed
              ? logoLightPro
              : logoLight
          }
          alt=""
          onClick={() => {
            handleJump(getWebsiteUrl());
          }}
          style={isCollapsed ? { display: "none" } : {}}
          className="logo"
        />
        <div
          className="side-menu-container-parent"
          style={isCollapsed ? { width: "70px" } : {}}
        >
          <ul className="side-menu-container">{renderSideMenu()}</ul>
          <div
            className="side-shelf-title-container"
            style={
              isCollapsed
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
          {isCollapsed ? null : !state.isCreateShelf ? (
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
                  isCollapsed
                    ? { display: "none", width: "70%" }
                    : { width: "60%" }
                }
                onClick={() => {
                  setState((prev) => ({ ...prev, isCreateShelf: true }));
                }}
              >
                {t("New shelf")}
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
          {!isCollapsed && (
            <div
              className={"side-menu-selector"}
              style={{ cursor: "pointer" }}
              onClick={() => {
                handleSortShelfDialog(true);
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
                  isCollapsed
                    ? { display: "none", width: "70%" }
                    : { width: "60%" }
                }
              >
                {t("Manage shelf")}
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
              navigate("/stats");
            }}
          >
            <div
              className="side-menu-icon"
              style={
                isCollapsed
                  ? {}
                  : { marginLeft: "20px", marginRight: "15px" }
              }
            >
              <span
                className="icon-chart sidebar-shelf-icon"
                style={
                  isCollapsed
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
                isCollapsed
                  ? { display: "none", width: "70%" }
                  : { width: "61%" }
              }
            >
              {t("Reading Stats")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
