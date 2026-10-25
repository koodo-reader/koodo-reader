import React, { useEffect, useRef, useState } from "react";
import "./navigationPanel.css";
import { isReadingRawPDF } from "../../../utils/common";
import ContentList from "../../lists/contentList";
import BookNavList from "../../lists/navList";
import { Trans } from "react-i18next";
import { NavigationPanelProps, NavigationPanelState } from "./interface";
import SearchBox from "../../../components/searchBox";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import EmptyCover from "../../../components/emptyCover";
import {
  ConfigService,
  HighlightUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import CoverUtil from "../../../utils/file/coverUtil";
import {
  NAV_TAB_TOGGLE_EVENT,
  openReadingPanel,
  READING_PANEL_TOGGLE_EVENT,
} from "../../../utils/reader/mouseEvent";
import { useAppStore } from "../../../store/useAppStore";

export interface SearchItemWithKey {
  key: string;
  item: any;
  index: number;
}

export interface SearchResultGroup {
  docIndex: number;
  title: string;
  items: SearchItemWithKey[];
}

// 解析单条 search item 的 cfi（JSON 字符串），安全容错
const parseLocation = (
  item: any
): { chapterTitle: string; chapterDocIndex: number } => {
  let bookLocation: any = {};
  try {
    bookLocation = JSON.parse(item.cfi) || {};
  } catch {
    bookLocation = {};
  }
  const rawIndex = bookLocation.chapterDocIndex;
  const docIndex =
    typeof rawIndex === "number" ? rawIndex : parseInt(rawIndex, 10);
  return {
    chapterTitle: bookLocation.chapterTitle || "",
    chapterDocIndex: Number.isFinite(docIndex) ? docIndex : 0,
  };
};

// 生成稳定 key：同章同位置可能 cfi 重复，追加 index 兜底保证唯一
export const buildSearchItemKey = (item: any, index: number): string => {
  const { chapterDocIndex } = parseLocation(item);
  return `${chapterDocIndex}:${item.cfi}:${index}`;
};

// 按 chapterDocIndex 升序分组，组内保留搜索返回顺序
export const groupSearchResults = (searchList: any[]): SearchResultGroup[] => {
  const map = new Map<number, SearchResultGroup>();
  for (let i = 0; i < searchList.length; i++) {
    const item = searchList[i];
    const { chapterDocIndex, chapterTitle } = parseLocation(item);
    let group = map.get(chapterDocIndex);
    if (!group) {
      group = {
        docIndex: chapterDocIndex,
        title: chapterTitle,
        items: [],
      };
      map.set(chapterDocIndex, group);
    }
    group.items.push({
      key: buildSearchItemKey(item, i),
      item,
      index: i,
    });
  }
  return Array.from(map.values()).sort((a, b) => a.docIndex - b.docIndex);
};

const NavigationPanel = (props: NavigationPanelProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const backgroundColor = useAppStore((s) => s.reader.backgroundColor);
  const isNavLocked = useAppStore((s) => s.reader.isNavLocked);
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleFetchBookmarks = useAppStore((s) => s.handleFetchBookmarks);
  const handleSearch = useAppStore((s) => s.handleSearch);
  const handleNavLock = useAppStore((s) => s.handleNavLock);
  const highlightUtilRef = useRef<any>(null);
  if (!highlightUtilRef.current) {
    highlightUtilRef.current = new HighlightUtil(ConfigService);
  }

  const [state, setState] = useState<NavigationPanelState>({
    currentTab: "contents",
    searchState: "",
    searchList: null,
    cover: "",
    isCoverExist: false,
    activeSearchKey: null,
    collapsedChapters: new Set<number>(),
  });

  const resetSearchState = () => {
    setState((prev) => ({
      ...prev,
      searchList: null,
      activeSearchKey: null,
      collapsedChapters: new Set<number>(),
    }));
  };

  const handleNavSearchState = (searchState: string) => {
    setState((prev) => ({ ...prev, searchState }));
    if (searchState === "searching") {
      resetSearchState();
    }
    if (searchState) {
      handleSearch(true);
    } else {
      if (ConfigService.getReaderConfig("isNavLocked") !== "yes") {
        handleSearch(false);
      }
    }
  };

  const handleSearchList = (searchList: any) => {
    if (searchList === null) {
      resetSearchState();
    } else {
      setState((prev) => ({ ...prev, searchList }));
    }
  };

  // componentWillReceiveProps: 只在 currentBook.key 变化时重新获取封面
  const prevBookKeyRef = useRef<string>(currentBook.key);
  useEffect(() => {
    if (prevBookKeyRef.current === currentBook.key) {
      return;
    }
    prevBookKeyRef.current = currentBook.key;
    let isActive = true;
    (async () => {
      const cover = await CoverUtil.getCover(currentBook);
      const isCoverExist = await CoverUtil.isCoverExist(currentBook);
      if (isActive) {
        setState((prev) => ({ ...prev, cover, isCoverExist }));
      }
    })();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook.key]);

  const isLeftPanelOpen = () => {
    const el = document.querySelector(
      ".navigation-panel-container"
    ) as HTMLElement | null;
    return !!el && !el.style.transform;
  };

  const handleChangeTab = (currentTab: string) => {
    setState((prev) => ({ ...prev, currentTab }));
  };

  const handleNavTabToggle = (event: Event) => {
    const tab = (event as CustomEvent<{ tab: string }>).detail?.tab;
    if (!tab) return;
    if (state.searchState) {
      handleNavSearchState("");
      handleSearch(false);
      resetSearchState();
    }
    if (isLeftPanelOpen() && state.currentTab === tab) {
      window.dispatchEvent(
        new CustomEvent(READING_PANEL_TOGGLE_EVENT, {
          detail: { position: "left" },
        })
      );
      return;
    }
    if (!isLeftPanelOpen()) {
      openReadingPanel("left");
    }
    handleChangeTab(tab);
  };

  // 让 window 监听器始终调用最新一次渲染的 handler
  const navTabToggleRef = useRef<(event: Event) => void>(() => {});
  navTabToggleRef.current = handleNavTabToggle;

  // componentDidMount + componentWillUnmount
  useEffect(() => {
    const listener = (event: Event) => navTabToggleRef.current(event);
    handleFetchBookmarks();
    window.addEventListener(NAV_TAB_TOGGLE_EVENT, listener);
    return () => {
      window.removeEventListener(NAV_TAB_TOGGLE_EVENT, listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLock = () => {
    handleNavLock(!isNavLocked);
    ConfigService.setReaderConfig("isNavLocked", !isNavLocked ? "yes" : "no");
    setTimeout(() => {
      renderBookFunc();
    }, 300);
  };

  const toggleChapter = (docIndex: number) => {
    setState((prev) => {
      const next = new Set(prev.collapsedChapters);
      if (next.has(docIndex)) {
        next.delete(docIndex);
      } else {
        next.add(docIndex);
      }
      return { ...prev, collapsedChapters: next };
    });
  };

  const handleSearchItemClick = async (item: any) => {
    let bookLocation = JSON.parse(item.cfi) || {};
    await htmlBook.rendition.goToPosition(
      JSON.stringify({
        text: bookLocation.text,
        chapterTitle: bookLocation.chapterTitle,
        chapterDocIndex: bookLocation.chapterDocIndex,
        chapterHref: bookLocation.chapterHref,
        count: bookLocation.hasOwnProperty("cfi")
          ? "ignore"
          : bookLocation.count,
        percentage: bookLocation.percentage,
        cfi: bookLocation.cfi,
        page: bookLocation.page,
      })
    );
    let style = highlightUtilRef.current.buildSearchHighlightStyle(
      isReadingRawPDF(currentBook),
      ConfigService.getReaderConfig("textOrientation") === "vertical"
    );
    htmlBook.rendition.highlightSearchNode(bookLocation.keyword, style);
  };

  const renderSearchList = () => {
    if (!state.searchList[0]) {
      return (
        <div className="navigation-panel-empty-bookmark">
          <Trans>Empty</Trans>
        </div>
      );
    }
    const groups: SearchResultGroup[] = groupSearchResults(state.searchList);
    const totalCount = state.searchList.length;
    return (
      <>
        <div className="nav-search-total">
          <Trans i18nKey="Total search results" count={totalCount}>
            {"Total " + totalCount + " results"}
          </Trans>
        </div>
        {groups.map((group: SearchResultGroup) => {
          const collapsed = state.collapsedChapters.has(group.docIndex);
          return (
            <li className="nav-search-group" key={`group-${group.docIndex}`}>
              <div
                className="nav-search-group-title"
                onClick={() => {
                  toggleChapter(group.docIndex);
                }}
              >
                <span
                  className="icon-dropdown font-featured-family-icon"
                  style={!collapsed ? { transform: "rotate(180deg)" } : {}}
                ></span>
                <span className="nav-search-group-name">{group.title}</span>
                <span className="nav-search-group-count">
                  ({group.items.length})
                </span>
              </div>
              {!collapsed && (
                <ul className="nav-search-group-items">
                  {group.items.map((entry) => {
                    const isActive = state.activeSearchKey === entry.key;
                    return (
                      <li
                        className={
                          isActive
                            ? "nav-search-list-item nav-search-list-item-active"
                            : "nav-search-list-item"
                        }
                        key={entry.key}
                        onClick={() => {
                          setState((prev) => ({
                            ...prev,
                            activeSearchKey: entry.key,
                          }));
                          handleSearchItemClick(entry.item);
                        }}
                      >
                        <div>
                          {Parser(DOMPurify.sanitize(entry.item.excerpt))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </>
    );
  };

  const searchProps = {
    mode: state.searchState ? "" : "nav",
    width: "100px",
    height: "35px",
    isNavSearch: state.searchState,
    handleNavSearchState,
    handleSearchList,
  };
  return (
    <div
      className="navigation-panel"
      style={{
        backgroundColor: isNavLocked ? backgroundColor : "",
        color: isNavLocked
          ? ConfigService.getReaderConfig("textColor")
          : "",
      }}
      onMouseLeave={(event) => {
        if (state.searchState && state.searchState !== "done") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {state.searchState ? (
        <>
          <div
            className="nav-close-icon"
            onClick={() => {
              handleNavSearchState("");
              handleSearch(false);
              resetSearchState();
            }}
          >
            <span className="icon-close theme-color-delete"></span>
          </div>

          <div className="header-search-container">
            <div
              className="navigation-search-title"
              style={{ height: "20px", margin: "0px 25px 13px" }}
            >
              <Trans>Search in the Book</Trans>
            </div>
            <SearchBox {...(searchProps as any)} />
          </div>
          <ul className="nav-search-list">
            {state.searchState === "searching" ? (
              <div className="loading-animation search-animation">
                <div className="loader"></div>
              </div>
            ) : state.searchList ? (
              renderSearchList()
            ) : null}
          </ul>
        </>
      ) : (
        <>
          <div className="navigation-header">
            <span
              className={
                isNavLocked
                  ? "icon-lock nav-lock-icon"
                  : "icon-unlock nav-lock-icon"
              }
              onClick={() => {
                handleLock();
              }}
            ></span>

            {state.isCoverExist ? (
              <img className="book-cover" src={state.cover} alt="" />
            ) : (
              <div className="book-cover">
                <EmptyCover
                  {...{
                    format: currentBook.format,
                    title: currentBook.name,
                    scale: 0.86,
                  }}
                />
              </div>
            )}

            <p className="book-title">{currentBook.name}</p>
            <p className="book-arthur">
              <Trans>Author</Trans>:{" "}
              <Trans>{currentBook.author || "Unknown author"}</Trans>
            </p>
            <span className="reading-duration">
              <Trans>Reading time</Trans>:{" "}
              {Math.floor(props.totalDuration / 60)}
              &nbsp; min
            </span>
            <div className="navigation-search-box">
              <SearchBox {...(searchProps as any)} />
            </div>

            <div className="navigation-navigation">
              <span
                className="book-bookmark-title"
                onClick={() => {
                  handleChangeTab("contents");
                }}
                style={state.currentTab === "contents" ? {} : { opacity: 0.5 }}
              >
                <Trans>Content</Trans>
              </span>
              <span
                className="book-bookmark-title"
                style={state.currentTab === "bookmarks" ? {} : { opacity: 0.5 }}
                onClick={() => {
                  handleChangeTab("bookmarks");
                }}
              >
                <Trans>Bookmark</Trans>
              </span>
              <span
                className="book-bookmark-title"
                style={state.currentTab === "notes" ? {} : { opacity: 0.5 }}
                onClick={() => {
                  handleChangeTab("notes");
                }}
              >
                <Trans>Note</Trans>
              </span>
              <span
                className="book-bookmark-title"
                style={state.currentTab === "highlights" ? {} : { opacity: 0.5 }}
                onClick={() => {
                  handleChangeTab("highlights");
                }}
              >
                <Trans>Highlight</Trans>
              </span>
            </div>
          </div>
          <div className="navigation-body-parent">
            <div className="navigation-body">
              {state.currentTab === "contents" ? (
                <ContentList />
              ) : (
                <BookNavList {...({ currentTab: state.currentTab } as any)} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NavigationPanel;
