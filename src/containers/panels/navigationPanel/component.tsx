import React from "react";
import "./navigationPanel.css";
import ContentList from "../../lists/contentList";
import BookNavList from "../../lists/navList";
import { Trans } from "react-i18next";
import { NavigationPanelProps, NavigationPanelState } from "./interface";
import SearchBox from "../../../components/searchBox";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import EmptyCover from "../../../components/emptyCover";
import { ConfigService, HighlightUtil } from "../../../assets/lib/kookit-extra-browser.min";
import CoverUtil from "../../../utils/file/coverUtil";
import {
  NAV_TAB_TOGGLE_EVENT,
  openReadingPanel,
  READING_PANEL_TOGGLE_EVENT,
} from "../../../utils/reader/mouseEvent";

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

class NavigationPanel extends React.Component<
  NavigationPanelProps,
  NavigationPanelState
> {
  highlightUtil: any;
  constructor(props: NavigationPanelProps) {
    super(props);
    this.highlightUtil = new HighlightUtil(ConfigService);
    this.state = {
      currentTab: "contents",
      chapters: [],
      searchState: "",
      searchList: null,
      cover: "",
      isCoverExist: false,
      activeSearchKey: null,
      collapsedChapters: new Set<number>(),
    };
  }
  handleNavSearchState = (state: string) => {
    this.setState({ searchState: state });
    if (state === "searching") {
      this.resetSearchState();
    }
    if (state) {
      this.props.handleSearch(true);
    } else {
      if (ConfigService.getReaderConfig("isNavLocked") !== "yes") {
        this.props.handleSearch(false);
      }
    }
  };
  handleSearchList = (searchList: any) => {
    if (searchList === null) {
      this.resetSearchState();
    } else {
      this.setState({ searchList });
    }
  };
  resetSearchState = () => {
    this.setState({
      searchList: null,
      activeSearchKey: null,
      collapsedChapters: new Set<number>(),
    });
  };
  async UNSAFE_componentWillReceiveProps(nextProps: NavigationPanelProps) {
    if (nextProps.currentBook.key !== this.props.currentBook.key) {
      let cover = await CoverUtil.getCover(nextProps.currentBook);
      let isCoverExist = await CoverUtil.isCoverExist(nextProps.currentBook);
      this.setState({
        cover,
        isCoverExist,
      });
    }
  }
  componentDidMount() {
    this.props.handleFetchBookmarks();
    window.addEventListener(NAV_TAB_TOGGLE_EVENT, this.handleNavTabToggle);
  }

  componentWillUnmount() {
    window.removeEventListener(NAV_TAB_TOGGLE_EVENT, this.handleNavTabToggle);
  }

  isLeftPanelOpen = () => {
    const el = document.querySelector(
      ".navigation-panel-container"
    ) as HTMLElement | null;
    return !!el && !el.style.transform;
  };

  handleNavTabToggle = (event: Event) => {
    const tab = (event as CustomEvent<{ tab: string }>).detail?.tab;
    if (!tab) return;
    if (this.state.searchState) {
      this.handleNavSearchState("");
      this.props.handleSearch(false);
      this.resetSearchState();
    }
    if (this.isLeftPanelOpen() && this.state.currentTab === tab) {
      window.dispatchEvent(
        new CustomEvent(READING_PANEL_TOGGLE_EVENT, {
          detail: { position: "left" },
        })
      );
      return;
    }
    if (!this.isLeftPanelOpen()) {
      openReadingPanel("left");
    }
    this.handleChangeTab(tab);
  };

  handleChangeTab = (currentTab: string) => {
    this.setState({ currentTab });
  };
  handleLock = () => {
    this.props.handleNavLock(!this.props.isNavLocked);
    ConfigService.setReaderConfig(
      "isNavLocked",
      !this.props.isNavLocked ? "yes" : "no"
    );
    setTimeout(() => {
      this.props.renderBookFunc();
    }, 300);
  };
  toggleChapter = (docIndex: number) => {
    this.setState((prevState) => {
      const next = new Set(prevState.collapsedChapters);
      if (next.has(docIndex)) {
        next.delete(docIndex);
      } else {
        next.add(docIndex);
      }
      return { collapsedChapters: next };
    });
  };
  handleSearchItemClick = async (item: any) => {
    let bookLocation = JSON.parse(item.cfi) || {};
    await this.props.htmlBook.rendition.goToPosition(
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
    let style = this.highlightUtil.buildSearchHighlightStyle(
      this.props.currentBook.format === "PDF" &&
        !ConfigService.getAllListConfig("convertPDFBooks").includes(
          this.props.currentBook.key
        )
    );
    this.props.htmlBook.rendition.highlightSearchNode(
      bookLocation.keyword,
      style
    );
  };
  renderSearchList = () => {
    if (!this.state.searchList[0]) {
      return (
        <div className="navigation-panel-empty-bookmark">
          <Trans>Empty</Trans>
        </div>
      );
    }
    const groups: SearchResultGroup[] = groupSearchResults(
      this.state.searchList
    );
    return groups.map((group: SearchResultGroup) => {
      const collapsed = this.state.collapsedChapters.has(group.docIndex);
      return (
        <li className="nav-search-group" key={`group-${group.docIndex}`}>
          <div
            className="nav-search-group-title"
            onClick={() => {
              this.toggleChapter(group.docIndex);
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
                const isActive = this.state.activeSearchKey === entry.key;
                return (
                  <li
                    className={
                      isActive
                        ? "nav-search-list-item nav-search-list-item-active"
                        : "nav-search-list-item"
                    }
                    key={entry.key}
                    onClick={() => {
                      this.setState({ activeSearchKey: entry.key });
                      this.handleSearchItemClick(entry.item);
                    }}
                  >
                    <div>{Parser(DOMPurify.sanitize(entry.item.excerpt))}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    });
  };
  render() {
    const searchProps = {
      mode: this.state.searchState ? "" : "nav",
      width: "100px",
      height: "35px",
      isNavSearch: this.state.searchState,
      handleNavSearchState: this.handleNavSearchState,
      handleSearchList: this.handleSearchList,
    };
    return (
      <div
        className="navigation-panel"
        style={{
          backgroundColor: this.props.isNavLocked
            ? this.props.backgroundColor
            : "",
          color: this.props.isNavLocked
            ? ConfigService.getReaderConfig("textColor")
            : "",
        }}
        onMouseLeave={(event) => {
          if (this.state.searchState && this.state.searchState !== "done") {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {this.state.searchState ? (
          <>
            <div
              className="nav-close-icon"
              onClick={() => {
                this.handleNavSearchState("");
                this.props.handleSearch(false);
                this.resetSearchState();
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
              {this.state.searchState === "searching" ? (
                <div className="loading-animation search-animation">
                  <div className="loader"></div>
                </div>
              ) : this.state.searchList ? (
                this.renderSearchList()
              ) : null}
            </ul>
          </>
        ) : (
          <>
            <div className="navigation-header">
              <span
                className={
                  this.props.isNavLocked
                    ? "icon-lock nav-lock-icon"
                    : "icon-unlock nav-lock-icon"
                }
                onClick={() => {
                  this.handleLock();
                }}
              ></span>

              {this.state.isCoverExist ? (
                <img className="book-cover" src={this.state.cover} alt="" />
              ) : (
                <div className="book-cover">
                  <EmptyCover
                    {...{
                      format: this.props.currentBook.format,
                      title: this.props.currentBook.name,
                      scale: 0.86,
                    }}
                  />
                </div>
              )}

              <p className="book-title">{this.props.currentBook.name}</p>
              <p className="book-arthur">
                <Trans>Author</Trans>:{" "}
                <Trans>
                  {this.props.currentBook.author || "Unknown author"}
                </Trans>
              </p>
              <span className="reading-duration">
                <Trans>Reading time</Trans>:{" "}
                {Math.floor(this.props.totalDuration / 60)}
                &nbsp; min
              </span>
              <div className="navigation-search-box">
                <SearchBox {...(searchProps as any)} />
              </div>

              <div className="navigation-navigation">
                <span
                  className="book-bookmark-title"
                  onClick={() => {
                    this.handleChangeTab("contents");
                  }}
                  style={
                    this.state.currentTab === "contents" ? {} : { opacity: 0.5 }
                  }
                >
                  <Trans>Content</Trans>
                </span>
                <span
                  className="book-bookmark-title"
                  style={
                    this.state.currentTab === "bookmarks"
                      ? {}
                      : { opacity: 0.5 }
                  }
                  onClick={() => {
                    this.handleChangeTab("bookmarks");
                  }}
                >
                  <Trans>Bookmark</Trans>
                </span>
                <span
                  className="book-bookmark-title"
                  style={
                    this.state.currentTab === "notes" ? {} : { opacity: 0.5 }
                  }
                  onClick={() => {
                    this.handleChangeTab("notes");
                  }}
                >
                  <Trans>Note</Trans>
                </span>
                <span
                  className="book-bookmark-title"
                  style={
                    this.state.currentTab === "highlights"
                      ? {}
                      : { opacity: 0.5 }
                  }
                  onClick={() => {
                    this.handleChangeTab("highlights");
                  }}
                >
                  <Trans>Highlight</Trans>
                </span>
              </div>
            </div>
            <div className="navigation-body-parent">
              <div className="navigation-body">
                {this.state.currentTab === "contents" ? (
                  <ContentList />
                ) : (
                  <BookNavList
                    {...({ currentTab: this.state.currentTab } as any)}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default NavigationPanel;
