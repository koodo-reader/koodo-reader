import React from "react";
import "./navList.css";
import { Trans } from "react-i18next";
import { NavListProps, NavListState } from "./interface";
import DeleteIcon from "../../../components/deleteIcon";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../../utils/storage/databaseService";
import ConfigUtil from "../../../utils/file/configUtil";
import Book from "../../../models/Book";
import Bookmark from "../../../models/Bookmark";
import Note from "../../../models/Note";
import { buildHighlightPreviewStyle } from "../../../utils/reader/highlightUtil";

class NavList extends React.Component<NavListProps, NavListState> {
  private searchInputRef: React.RefObject<HTMLInputElement>;

  constructor(props: NavListProps) {
    super(props);
    this.state = {
      deleteIndex: -1,
      currentData: [],
      isSearchOpen: false,
      searchKeyword: "",
      searchResults: [],
      isComposing: false,
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
  };

  handleCompositionEnd = (event: React.CompositionEvent<HTMLInputElement>) => {
    const keyword = event.currentTarget.value;
    this.setState({ isComposing: false, searchKeyword: keyword }, () => {
      this.handleSearch(keyword);
    });
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
          currentData: bookmarks
            .filter((item) => item.bookKey === currentBook.key)
            .reverse(),
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
    const [styleType, color] = colorCode.split("-");
    return buildHighlightPreviewStyle(styleType, color);
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
    const displayData = isSearching
      ? this.state.searchResults
      : this.state.currentData;

    return (
      <div className="book-bookmark-container">
        <div className="book-nav-header">
          <div>
            <Trans>Total</Trans>: {this.state.currentData.length}
          </div>
          <div onClick={this.toggleSearch} className="book-nav-expand">
            <span
              className="icon-search"
              style={{ paddingRight: "5px" }}
            ></span>
            <Trans>{this.state.isSearchOpen ? "Cancel" : "Search"}</Trans>
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
