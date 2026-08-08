import React from "react";
import "./navList.css";
import { Trans } from "react-i18next";
import { NavListProps, NavListState } from "./interface";
import DeleteIcon from "../../../components/deleteIcon";
import toast from "react-hot-toast";
import {
  ConfigService,
  HighlightUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../../utils/storage/databaseService";
import ConfigUtil from "../../../utils/file/configUtil";
import Book from "../../../models/Book";
import Bookmark from "../../../models/Bookmark";
import Note from "../../../models/Note";

class NavList extends React.Component<NavListProps, NavListState> {
  private searchInputRef: React.RefObject<HTMLInputElement>;
  highlightUtil: any;

  constructor(props: NavListProps) {
    super(props);
    this.highlightUtil = new HighlightUtil(ConfigService);
    let sortCode = 1;
    let orderCode = 2;
    const navSortCode = ConfigService.getReaderConfig("navSortCode");
    if (navSortCode) {
      try {
        const parsed = JSON.parse(navSortCode);
        if (parsed && (parsed.sort === 1 || parsed.sort === 2)) {
          sortCode = parsed.sort;
        }
        if (parsed && (parsed.order === 1 || parsed.order === 2)) {
          orderCode = parsed.order;
        }
      } catch {
        // ignore malformed config, fall back to defaults
      }
    }
    this.state = {
      deleteIndex: -1,
      currentData: [],
      isSearchOpen: false,
      searchKeyword: "",
      searchResults: [],
      isComposing: false,
      isSortOpen: false,
      sortCode,
      orderCode,
    };
    this.searchInputRef = React.createRef<HTMLInputElement>();
  }
  componentDidMount() {
    this.props.htmlBook.rendition.on("rendered", () => {
      this.handleDisplayBookmark();
    });
    this.handleCurrentDataUpdate(
      this.props.currentTab,
      this.props.currentBook,
      this.props.bookmarks,
      this.props.notes,
      this.props.highlights
    );
  }
  UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<NavListProps>,
    nextContext: any
  ): void {
    const tabOrBookChanged =
      nextProps.currentTab !== this.props.currentTab ||
      nextProps.currentBook.key !== this.props.currentBook.key;

    if (tabOrBookChanged) {
      this.setState({
        isSearchOpen: false,
        searchKeyword: "",
        searchResults: [],
        isComposing: false,
      });
    }

    if (
      tabOrBookChanged ||
      nextProps.bookmarks !== this.props.bookmarks ||
      nextProps.notes !== this.props.notes ||
      nextProps.highlights !== this.props.highlights
    ) {
      this.handleCurrentDataUpdate(
        nextProps.currentTab,
        nextProps.currentBook,
        nextProps.bookmarks,
        nextProps.notes,
        nextProps.highlights
      );
    }
  }

  toggleSearch = () => {
    const isSearchOpen = !this.state.isSearchOpen;
    this.setState(
      {
        isSearchOpen,
        searchKeyword: isSearchOpen ? this.state.searchKeyword : "",
        searchResults: isSearchOpen ? this.state.searchResults : [],
        isComposing: false,
      },
      () => {
        if (isSearchOpen) {
          this.searchInputRef.current?.focus();
        }
      }
    );
  };

  getSearchPlaceholder = () => {
    if (this.props.currentTab === "bookmarks") {
      return this.props.t("Search bookmarks...");
    }
    if (this.props.currentTab === "notes") {
      return this.props.t("Search notes...");
    }
    return this.props.t("Search highlights...");
  };

  handleSearch = async (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      this.setState({ searchResults: [] });
      return;
    }
    const { currentTab, currentBook } = this.props;
    let results: any[] = [];
    if (currentTab === "bookmarks") {
      results = await ConfigUtil.searchBookmarksByKeyword(
        trimmedKeyword,
        currentBook.key
      );
    } else if (currentTab === "notes") {
      results = await ConfigUtil.searchNotesByKeyword(
        trimmedKeyword,
        currentBook.key,
        "note"
      );
    } else {
      results = await ConfigUtil.searchNotesByKeyword(
        trimmedKeyword,
        currentBook.key,
        "highlight"
      );
    }
    this.setState({ searchResults: results || [] });
  };

  handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = event.target.value;
    this.setState({ searchKeyword: keyword }, () => {
      if (!this.state.isComposing) {
        this.handleSearch(keyword);
      }
    });
  };

  handleCompositionStart = () => {
    this.setState({ isComposing: true });
    ConfigService.setReaderConfig("isTempLocked", "yes");
    ConfigService.setReaderConfig("isNavLocked", "yes");
  };

  handleCompositionEnd = (event: React.CompositionEvent<HTMLInputElement>) => {
    const keyword = event.currentTarget.value;
    this.setState({ isComposing: false, searchKeyword: keyword }, () => {
      this.handleSearch(keyword);
    });
    if (ConfigService.getReaderConfig("isTempLocked") === "yes") {
      ConfigService.setReaderConfig("isNavLocked", "");
      ConfigService.setReaderConfig("isTempLocked", "");
    }
  };

  async handleJump(cfi: string) {
    //bookmark redirect
    if (!cfi) {
      toast(this.props.t("Wrong bookmark"));
      return;
    }
    let bookLocation;
    try {
      bookLocation = JSON.parse(cfi) || {};
    } catch (error) {
      bookLocation = {
        cfi: cfi,
      };
    }
    const prevPosition = ConfigService.getObjectConfig(
      this.props.currentBook.key,
      "recordLocation",
      {}
    );
    this.props.handleJumpPosition(prevPosition);
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
  }
  async handleCurrentDataUpdate(
    currentTab: string,
    currentBook: Book,
    bookmarks: Bookmark[],
    notes: Note[],
    highlights: Note[]
  ) {
    if (currentTab === "bookmarks") {
      this.setState(
        {
          currentData: bookmarks.filter(
            (item) => item.bookKey === currentBook.key
          ),
        },
        () => {
          if (this.state.searchKeyword.trim()) {
            this.handleSearch(this.state.searchKeyword);
          }
        }
      );
    } else if (currentTab === "notes") {
      let noteList = notes.filter((item) => item.bookKey === currentBook.key);
      let fullNotes: any[] = [];
      for (let i = 0; i < noteList.length; i++) {
        let note = await DatabaseService.getRecord(noteList[i].key, "notes");
        if (note) {
          fullNotes.push(note);
        }
      }
      this.setState({ currentData: fullNotes }, () => {
        if (this.state.searchKeyword.trim()) {
          this.handleSearch(this.state.searchKeyword);
        }
      });
    } else {
      let highlightList = highlights.filter(
        (item) => item.bookKey === currentBook.key
      );
      let fullHighlights: any[] = [];
      for (let i = 0; i < highlightList.length; i++) {
        let highlight = await DatabaseService.getRecord(
          highlightList[i].key,
          "notes"
        );
        if (highlight) {
          fullHighlights.push(highlight);
        }
      }
      this.setState({ currentData: fullHighlights }, () => {
        if (this.state.searchKeyword.trim()) {
          this.handleSearch(this.state.searchKeyword);
        }
      });
    }
  }
  async handleDisplayBookmark() {
    this.props.handleShowBookmark(false);
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
    } = ConfigService.getObjectConfig(
      this.props.currentBook.key,
      "recordLocation",
      {}
    );
    let bookmarks = await DatabaseService.getRecordsByBookKey(
      this.props.currentBook.key,
      "bookmarks"
    );
    for (let i = 0; i < bookmarks.length; i++) {
      if (bookmarks[i].cfi === JSON.stringify(bookLocation)) {
        this.props.handleShowBookmark(true);
      }
    }
  }
  handleShowDelete = (index: number) => {
    this.setState({ deleteIndex: index });
  };
  getHighlightPreviewStyle = (colorCode: string) => {
    let styleType = "background";
    let color = "#FEF3CD";
    if (typeof colorCode === "number") {
      let highlightValue =
        this.highlightUtil.convertNumberToHighlightValue(colorCode);
      styleType = highlightValue.styleType;
      color = highlightValue.color;
    } else {
      [styleType, color] = colorCode.split("-");
    }

    return this.highlightUtil.buildHighlightPreviewStyle(styleType, color);
  };
  toggleSortOpen = () => {
    this.setState({ isSortOpen: !this.state.isSortOpen });
  };
  handleSortSelect = (code: number) => {
    this.setState({ sortCode: code, isSortOpen: false }, () => {
      ConfigService.setReaderConfig(
        "navSortCode",
        JSON.stringify({ sort: code, order: this.state.orderCode })
      );
    });
  };
  handleOrderSelect = (code: number) => {
    this.setState({ orderCode: code, isSortOpen: false }, () => {
      ConfigService.setReaderConfig(
        "navSortCode",
        JSON.stringify({ sort: this.state.sortCode, order: code })
      );
    });
  };
  getSortedData = (data: (Bookmark | Note)[]) => {
    const { sortCode, orderCode } = this.state;
    return [...data].sort((a: any, b: any) => {
      const diff =
        sortCode === 1
          ? (Number(a.key) || 0) - (Number(b.key) || 0)
          : (Number(a.percentage) || 0) - (Number(b.percentage) || 0);
      return orderCode === 1 ? diff : -diff;
    });
  };
  renderBookNavList = (displayData: (Bookmark | Note)[]) => {
    return displayData.map((item: any, index: number) => {
      const bookmarkProps = {
        itemKey: item.key,
        mode: this.props.currentTab === "bookmarks" ? "bookmarks" : "notes",
      };
      return (
        <li
          className="book-bookmark-list"
          key={item.key}
          onMouseEnter={() => {
            this.handleShowDelete(index);
          }}
          onMouseLeave={() => {
            this.handleShowDelete(-1);
          }}
        >
          <div
            style={{
              margin: "5px",
              marginTop: "10px",
              marginBottom: "10px",
            }}
            onClick={async () => {
              await this.handleJump(item.cfi);
            }}
          >
            <p
              className="book-bookmark-digest"
              style={
                item.color ? this.getHighlightPreviewStyle(item.color) : {}
              }
            >
              {this.props.currentTab === "bookmarks"
                ? item.label
                : this.props.currentTab === "notes"
                  ? item.text
                  : item.text}
            </p>
            <div style={{ marginTop: "10px", fontWeight: "bold" }}>
              {this.props.currentTab === "notes" ? item.notes : null}
            </div>
          </div>

          <div
            className="bookmark-page-list-item-title"
            onClick={async () => {
              await this.handleJump(item.cfi);
            }}
          >
            <Trans>{item.chapter}</Trans>
          </div>
          <div className="book-bookmark-progress">
            {Math.floor(item.percentage * 100)}%
          </div>
          {this.state.deleteIndex === index ? (
            <DeleteIcon {...(bookmarkProps as any)} />
          ) : null}
        </li>
      );
    });
  };
  render() {
    const isSearching =
      this.state.searchKeyword.trim().length > 0 && !this.state.isComposing;
    const baseList = isSearching
      ? this.state.searchResults
      : this.state.currentData;
    const displayData = this.getSortedData(baseList);

    return (
      <div className="book-bookmark-container">
        <div className="book-nav-header">
          <div>
            <Trans>Total</Trans>: {this.state.currentData.length}
          </div>
          <div className="book-nav-actions">
            <div className="nav-sort-wrap">
              <div className="book-nav-expand" onClick={this.toggleSortOpen}>
                <span
                  className="icon-sort-desc"
                  style={{ paddingRight: "5px" }}
                ></span>
                <Trans>Sort</Trans>
              </div>
              {this.state.isSortOpen && (
                <div className="sort-dialog-container nav-sort-dialog-container">
                  <ul className="sort-by-category">
                    {["Sort by Date", "Reading progress"].map((item, index) => {
                      return (
                        <li
                          className="sort-by-category-list"
                          onClick={() => {
                            this.handleSortSelect(index + 1);
                          }}
                          style={
                            this.state.sortCode === index + 1
                              ? {}
                              : { opacity: 0.34 }
                          }
                          key={index + 1}
                        >
                          <Trans>{item}</Trans>
                          {this.state.sortCode === index + 1 && (
                            <span
                              className="icon-check"
                              style={{ fontWeight: "bold" }}
                            ></span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="sort-dialog-seperator"></div>
                  <ul className="sort-by-order">
                    <li
                      className="sort-by-order-list"
                      onClick={() => {
                        this.handleOrderSelect(1);
                      }}
                      style={
                        this.state.orderCode === 1 ? {} : { opacity: 0.34 }
                      }
                    >
                      <Trans>Ascend</Trans>
                      {this.state.orderCode === 1 && (
                        <span
                          className="icon-check"
                          style={{ fontWeight: "bold" }}
                        ></span>
                      )}
                    </li>
                    <li
                      className="sort-by-order-list"
                      onClick={() => {
                        this.handleOrderSelect(2);
                      }}
                      style={
                        this.state.orderCode === 2 ? {} : { opacity: 0.34 }
                      }
                    >
                      <Trans>Descend</Trans>
                      {this.state.orderCode === 2 && (
                        <span
                          className="icon-check"
                          style={{ fontWeight: "bold" }}
                        ></span>
                      )}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div onClick={this.toggleSearch} className="book-nav-expand">
              <span
                className="icon-search"
                style={{ paddingRight: "5px" }}
              ></span>
              <Trans>{this.state.isSearchOpen ? "Cancel" : "Search"}</Trans>
            </div>
          </div>
        </div>
        {this.state.isSearchOpen && (
          <div className="book-nav-search">
            <input
              ref={this.searchInputRef}
              className="book-nav-search-input"
              value={this.state.searchKeyword}
              onChange={this.handleSearchChange}
              onCompositionStart={this.handleCompositionStart}
              onCompositionEnd={this.handleCompositionEnd}
              placeholder={this.getSearchPlaceholder()}
            />
          </div>
        )}
        {isSearching && displayData.length === 0 ? (
          <div className="book-nav-search-empty">
            <Trans>No results found</Trans>
          </div>
        ) : displayData.length === 0 ? (
          <div className="navigation-panel-empty-bookmark">
            <Trans>Empty</Trans>
          </div>
        ) : (
          <ul className="book-bookmark">
            {this.renderBookNavList(displayData)}
          </ul>
        )}
      </div>
    );
  }
}

export default NavList;
