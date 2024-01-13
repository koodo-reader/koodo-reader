import React from "react";
import "./navigationPanel.css";
import ContentList from "../../lists/contentList";
import BookNavList from "../../lists/navList";
import { Trans } from "react-i18next";
import { NavigationPanelProps, NavigationPanelState } from "./interface";
import SearchBox from "../../../components/searchBox";
import Parser from "html-react-parser";
import * as DOMPurify from "dompurify";
import EmptyCover from "../../../components/emptyCover";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { getIframeDoc } from "../../../utils/serviceUtils/docUtil";

class NavigationPanel extends React.Component<
  NavigationPanelProps,
  NavigationPanelState
> {
  constructor(props: NavigationPanelProps) {
    super(props);
    this.state = {
      currentTab: "contents",
      chapters: [],
      isSearch: false,
      searchList: null,
      startIndex: 0,
      currentIndex: 0,
      isNavLocked:
        StorageUtil.getReaderConfig("isNavLocked") === "yes" ? true : false,
    };
  }
  handleSearchState = (isSearch: boolean) => {
    this.setState({ isSearch });
  };
  handleSearchList = (searchList: any) => {
    this.setState({ searchList });
  };
  componentDidMount() {
    this.props.handleFetchBookmarks();
  }

  handleChangeTab = (currentTab: string) => {
    this.setState({ currentTab });
  };
  handleLock = () => {
    this.setState({ isNavLocked: !this.state.isNavLocked }, () => {
      StorageUtil.setReaderConfig(
        "isNavLocked",
        this.state.isNavLocked ? "yes" : "no"
      );
    });
  };
  renderSearchList = () => {
    if (!this.state.searchList[0]) {
      return (
        <div className="navigation-panel-empty-bookmark">
          <Trans>Empty</Trans>
        </div>
      );
    }
    return this.state.searchList
      .slice(
        this.state.currentIndex * 10,
        this.state.currentIndex * 10 + 10 > this.state.searchList.length
          ? this.state.searchList.length
          : this.state.currentIndex * 10 + 10
      )
      .map((item: any, index: number) => {
        return (
          <li
            className="nav-search-list-item"
            key={index}
            onClick={async () => {
              let bookLocation = JSON.parse(item.cfi) || {};
              //compatile with lower version(1.5.1)
              if (bookLocation.cfi) {
                await this.props.htmlBook.rendition.goToChapter(
                  bookLocation.chapterDocIndex,
                  bookLocation.chapterHref,
                  bookLocation.chapterTitle
                );
              } else {
                await this.props.htmlBook.rendition.goToPosition(
                  JSON.stringify({
                    text: bookLocation.text,
                    chapterTitle: bookLocation.chapterTitle,
                    chapterDocIndex: bookLocation.chapterDocIndex,
                    chapterHref: bookLocation.chapterHref,
                    count: bookLocation.count,
                    percentage: bookLocation.percentage,
                    cfi: bookLocation.cfi,
                    page: bookLocation.page,
                  })
                );
                let style = "background: #f3a6a68c";
                this.props.htmlBook.rendition.highlightNode(
                  bookLocation.text,
                  style
                );
              }
            }}
          >
            {Parser(DOMPurify.sanitize(item.excerpt))}
          </li>
        );
      });
  };
  renderSearchPage = () => {
    let startIndex = this.state.startIndex;
    let currentIndex =
      startIndex > 0 ? startIndex + 2 : this.state.currentIndex;
    let pageList: any[] = [];
    let total = Math.ceil(this.state.searchList.length / 10);
    if (total <= 5) {
      for (let i = 0; i < total; i++) {
        pageList.push(
          <li
            className={
              currentIndex === i
                ? "nav-search-page-item active-page "
                : "nav-search-page-item"
            }
            onClick={() => {
              this.setState({ currentIndex: i });
            }}
          >
            {i + 1}
          </li>
        );
      }
    } else {
      for (
        let i = 0;
        i < (total - startIndex < 5 ? total - startIndex : 5);
        i++
      ) {
        let isShow = currentIndex > 2 ? i === 2 : currentIndex === i;
        pageList.push(
          <li
            className={
              isShow
                ? "nav-search-page-item active-page "
                : "nav-search-page-item"
            }
            onClick={() => {
              if (i === 3 && startIndex === 0) {
                this.setState({
                  startIndex: 1,
                  currentIndex: 3,
                });
                return;
              }
              this.setState({
                startIndex: currentIndex > 2 ? i + startIndex - 2 : 0,
                currentIndex: i + startIndex,
              });
            }}
          >
            {i + startIndex + 1}
          </li>
        );
      }
      if (total - startIndex < 5) {
        for (let i = 0; i < 6 - pageList.length; i++) {
          pageList.push(<li className="nav-search-page-item">EOF</li>);
        }
      }
    }
    return pageList;
  };
  render() {
    const searchProps = {
      mode: this.state.isSearch ? "" : "nav",
      width: "100px",
      height: "35px",
      isNavSearch: this.state.isSearch,
      handleSearchState: this.handleSearchState,
      handleSearchList: this.handleSearchList,
    };
    const bookmarkProps = {
      currentTab: this.state.currentTab,
    };
    return (
      <div className="navigation-panel">
        {this.state.isSearch ? (
          <>
            <div
              className="nav-close-icon"
              onClick={() => {
                this.handleSearchState(false);
                this.props.handleSearch(false);
                this.setState({ searchList: null });
              }}
            >
              <span className="icon-close"></span>
            </div>

            <div className="header-search-container">
              <div
                className="navigation-search-title"
                style={{ height: "20px", margin: "0px 25px 13px" }}
              >
                <Trans>Search in the Book</Trans>
              </div>
              <SearchBox {...searchProps} />
            </div>
            <ul className="nav-search-list">
              {this.state.searchList ? this.renderSearchList() : null}
            </ul>
            <ul className="nav-search-page">
              {this.state.searchList ? this.renderSearchPage() : null}
            </ul>
          </>
        ) : (
          <>
            <div className="navigation-header">
              <span
                className={
                  this.state.isNavLocked
                    ? "icon-lock nav-lock-icon"
                    : "icon-unlock nav-lock-icon"
                }
                onClick={() => {
                  this.handleLock();
                }}
              ></span>

              {this.props.currentBook.cover &&
              this.props.currentBook.cover !== "noCover" ? (
                <img
                  className="book-cover"
                  src={this.props.currentBook.cover}
                  alt=""
                />
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
                  {this.props.currentBook.author
                    ? this.props.currentBook.author
                    : "Unknown Author"}
                </Trans>
              </p>
              <span className="reading-duration">
                <Trans>Reading Time</Trans>: {Math.floor(this.props.time / 60)}
                &nbsp; min
              </span>
              <div className="navigation-search-box">
                <SearchBox {...searchProps} />
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
                    this.state.currentTab === "digests" ? {} : { opacity: 0.5 }
                  }
                  onClick={() => {
                    this.handleChangeTab("digests");
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
                  <BookNavList {...bookmarkProps} />
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
