import React, { useEffect, useRef, useState } from "react";
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

interface NavPrevProps {
  currentTab: string;
  currentBookKey: string;
  bookmarks: Bookmark[];
  notes: Note[];
  highlights: Note[];
}

const NavList = (props: NavListProps) => {
  const [state, setState] = useState<NavListState>(() => {
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
    return {
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
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const highlightUtilRef = useRef<any>(null);
  if (!highlightUtilRef.current) {
    highlightUtilRef.current = new HighlightUtil(ConfigService);
  }
  const highlightUtil = highlightUtilRef.current;
  const propsRef = useRef(props);
  propsRef.current = props;
  const prevPropsRef = useRef<NavPrevProps | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleSearch = async (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      setState((prev) => ({ ...prev, searchResults: [] }));
      return;
    }
    const { currentTab, currentBook } = propsRef.current;
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
    setState((prev) => ({ ...prev, searchResults: results || [] }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = event.target.value;
    setState((prev) => ({ ...prev, searchKeyword: keyword }));
    if (!stateRef.current.isComposing) {
      handleSearch(keyword);
    }
  };

  const handleCompositionStart = () => {
    setState((prev) => ({ ...prev, isComposing: true }));
    ConfigService.setReaderConfig("isTempLocked", "yes");
    ConfigService.setReaderConfig("isNavLocked", "yes");
  };

  const handleCompositionEnd = (
    event: React.CompositionEvent<HTMLInputElement>
  ) => {
    const keyword = event.currentTarget.value;
    setState((prev) => ({
      ...prev,
      isComposing: false,
      searchKeyword: keyword,
    }));
    handleSearch(keyword);
    if (ConfigService.getReaderConfig("isTempLocked") === "yes") {
      ConfigService.setReaderConfig("isNavLocked", "");
      ConfigService.setReaderConfig("isTempLocked", "");
    }
  };

  const toggleSearch = () => {
    const isSearchOpen = !state.isSearchOpen;
    setState((prev) => ({
      ...prev,
      isSearchOpen,
      searchKeyword: isSearchOpen ? prev.searchKeyword : "",
      searchResults: isSearchOpen ? prev.searchResults : [],
      isComposing: false,
    }));
  };

  const getSearchPlaceholder = () => {
    if (props.currentTab === "bookmarks") {
      return props.t("Search bookmarks...");
    }
    if (props.currentTab === "notes") {
      return props.t("Search notes...");
    }
    return props.t("Search highlights...");
  };

  const handleJump = async (cfi: string) => {
    //bookmark redirect
    if (!cfi) {
      toast(props.t("Wrong bookmark"));
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
      props.currentBook.key,
      "recordLocation",
      {}
    );
    props.handleJumpPosition(prevPosition);
    await props.htmlBook.rendition.goToPosition(
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
  };

  const handleCurrentDataUpdate = async (
    currentTab: string,
    currentBook: Book,
    bookmarks: Bookmark[],
    notes: Note[],
    highlights: Note[],
    keywordOverride?: string
  ) => {
    const applyData = (data: (Bookmark | Note)[]) => {
      const keyword =
        keywordOverride !== undefined
          ? keywordOverride
          : stateRef.current.searchKeyword;
      setState((prev) => ({ ...prev, currentData: data }));
      if (keyword.trim()) {
        handleSearch(keyword);
      }
    };
    if (currentTab === "bookmarks") {
      applyData(
        bookmarks.filter((item) => item.bookKey === currentBook.key)
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
      applyData(fullNotes);
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
      applyData(fullHighlights);
    }
  };

  const handleDisplayBookmark = async () => {
    propsRef.current.handleShowBookmark(false);
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
    } = ConfigService.getObjectConfig(
      propsRef.current.currentBook.key,
      "recordLocation",
      {}
    );
    let bookmarks = await DatabaseService.getRecordsByBookKey(
      propsRef.current.currentBook.key,
      "bookmarks"
    );
    for (let i = 0; i < bookmarks.length; i++) {
      if (bookmarks[i].cfi === JSON.stringify(bookLocation)) {
        propsRef.current.handleShowBookmark(true);
      }
    }
  };

  useEffect(() => {
    const rendition = props.htmlBook.rendition;
    const onRendered = () => {
      handleDisplayBookmark();
    };
    rendition.on("rendered", onRendered);
    handleCurrentDataUpdate(
      props.currentTab,
      props.currentBook,
      props.bookmarks,
      props.notes,
      props.highlights
    );
    return () => {
      rendition.off?.("rendered", onRendered);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prevProps = prevPropsRef.current;
    prevPropsRef.current = {
      currentTab: props.currentTab,
      currentBookKey: props.currentBook.key,
      bookmarks: props.bookmarks,
      notes: props.notes,
      highlights: props.highlights,
    };

    if (!prevProps) return;

    const tabOrBookChanged =
      props.currentTab !== prevProps.currentTab ||
      props.currentBook.key !== prevProps.currentBookKey;

    if (tabOrBookChanged) {
      setState((prev) => ({
        ...prev,
        isSearchOpen: false,
        searchKeyword: "",
        searchResults: [],
        isComposing: false,
      }));
    }

    if (
      tabOrBookChanged ||
      props.bookmarks !== prevProps.bookmarks ||
      props.notes !== prevProps.notes ||
      props.highlights !== prevProps.highlights
    ) {
      handleCurrentDataUpdate(
        props.currentTab,
        props.currentBook,
        props.bookmarks,
        props.notes,
        props.highlights,
        tabOrBookChanged ? "" : undefined
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.currentTab,
    props.currentBook,
    props.bookmarks,
    props.notes,
    props.highlights,
  ]);

  useEffect(() => {
    if (state.isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [state.isSearchOpen]);

  const handleShowDelete = (index: number) => {
    setState((prev) => ({ ...prev, deleteIndex: index }));
  };

  const getHighlightPreviewStyle = (colorCode: string) => {
    let styleType = "background";
    let color = "#FEF3CD";
    if (typeof colorCode === "number") {
      let highlightValue =
        highlightUtil.convertNumberToHighlightValue(colorCode);
      styleType = highlightValue.styleType;
      color = highlightValue.color;
    } else {
      [styleType, color] = colorCode.split("-");
    }

    return highlightUtil.buildHighlightPreviewStyle(styleType, color);
  };

  const toggleSortOpen = () => {
    setState((prev) => ({ ...prev, isSortOpen: !prev.isSortOpen }));
  };

  const handleSortSelect = (code: number) => {
    setState((prev) => ({ ...prev, sortCode: code, isSortOpen: false }));
    ConfigService.setReaderConfig(
      "navSortCode",
      JSON.stringify({ sort: code, order: stateRef.current.orderCode })
    );
  };

  const handleOrderSelect = (code: number) => {
    setState((prev) => ({ ...prev, orderCode: code, isSortOpen: false }));
    ConfigService.setReaderConfig(
      "navSortCode",
      JSON.stringify({ sort: stateRef.current.sortCode, order: code })
    );
  };

  const getSortedData = (data: (Bookmark | Note)[]) => {
    const { sortCode, orderCode } = state;
    return [...data].sort((a: any, b: any) => {
      const diff =
        sortCode === 1
          ? (Number(a.key) || 0) - (Number(b.key) || 0)
          : (Number(a.percentage) || 0) - (Number(b.percentage) || 0);
      return orderCode === 1 ? diff : -diff;
    });
  };

  const renderBookNavList = (displayData: (Bookmark | Note)[]) => {
    return displayData.map((item: any, index: number) => {
      const bookmarkProps = {
        itemKey: item.key,
        mode: props.currentTab === "bookmarks" ? "bookmarks" : "notes",
      };
      return (
        <li
          className="book-bookmark-list"
          key={item.key}
          onMouseEnter={() => {
            handleShowDelete(index);
          }}
          onMouseLeave={() => {
            handleShowDelete(-1);
          }}
        >
          <div
            style={{
              margin: "5px",
              marginTop: "10px",
              marginBottom: "10px",
            }}
            onClick={async () => {
              await handleJump(item.cfi);
            }}
          >
            <p
              className="book-bookmark-digest"
              style={item.color ? getHighlightPreviewStyle(item.color) : {}}
            >
              {props.currentTab === "bookmarks"
                ? item.label
                : props.currentTab === "notes"
                  ? item.text
                  : item.text}
            </p>
            <div style={{ marginTop: "10px", fontWeight: "bold" }}>
              {props.currentTab === "notes" ? item.notes : null}
            </div>
          </div>

          <div
            className="bookmark-page-list-item-title"
            onClick={async () => {
              await handleJump(item.cfi);
            }}
          >
            <Trans>{item.chapter}</Trans>
          </div>
          <div className="book-bookmark-progress">
            {Math.floor(item.percentage * 100)}%
          </div>
          {state.deleteIndex === index ? (
            <DeleteIcon {...(bookmarkProps as any)} />
          ) : null}
        </li>
      );
    });
  };

  const isSearching =
    state.searchKeyword.trim().length > 0 && !state.isComposing;
  const baseList = isSearching ? state.searchResults : state.currentData;
  const displayData = getSortedData(baseList);

  return (
    <div className="book-bookmark-container">
      <div className="book-nav-header">
        <div>
          <Trans>Total</Trans>: {state.currentData.length}
        </div>
        <div className="book-nav-actions">
          <div className="nav-sort-wrap">
            <div className="book-nav-expand" onClick={toggleSortOpen}>
              <span
                className="icon-sort-desc"
                style={{ paddingRight: "5px" }}
              ></span>
              <Trans>Sort</Trans>
            </div>
            {state.isSortOpen && (
              <div className="sort-dialog-container nav-sort-dialog-container">
                <ul className="sort-by-category">
                  {["Sort by Date", "Reading progress"].map((item, index) => {
                    return (
                      <li
                        className="sort-by-category-list"
                        onClick={() => {
                          handleSortSelect(index + 1);
                        }}
                        style={
                          state.sortCode === index + 1 ? {} : { opacity: 0.34 }
                        }
                        key={index + 1}
                      >
                        <Trans>{item}</Trans>
                        {state.sortCode === index + 1 && (
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
                      handleOrderSelect(1);
                    }}
                    style={state.orderCode === 1 ? {} : { opacity: 0.34 }}
                  >
                    <Trans>Ascend</Trans>
                    {state.orderCode === 1 && (
                      <span
                        className="icon-check"
                        style={{ fontWeight: "bold" }}
                      ></span>
                    )}
                  </li>
                  <li
                    className="sort-by-order-list"
                    onClick={() => {
                      handleOrderSelect(2);
                    }}
                    style={state.orderCode === 2 ? {} : { opacity: 0.34 }}
                  >
                    <Trans>Descend</Trans>
                    {state.orderCode === 2 && (
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
          <div onClick={toggleSearch} className="book-nav-expand">
            <span className="icon-search" style={{ paddingRight: "5px" }}></span>
            <Trans>{state.isSearchOpen ? "Cancel" : "Search"}</Trans>
          </div>
        </div>
      </div>
      {state.isSearchOpen && (
        <div className="book-nav-search">
          <input
            ref={searchInputRef}
            className="book-nav-search-input"
            value={state.searchKeyword}
            onChange={handleSearchChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={getSearchPlaceholder()}
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
        <ul className="book-bookmark">{renderBookNavList(displayData)}</ul>
      )}
    </div>
  );
};

export default NavList;
