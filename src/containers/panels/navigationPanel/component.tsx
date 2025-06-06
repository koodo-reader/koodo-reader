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
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import CoverUtil from "../../../utils/file/coverUtil";
import BookUtil from "../../../utils/file/bookUtil";

class NavigationPanel extends React.Component<
  NavigationPanelProps,
  NavigationPanelState
> {
  constructor(props: NavigationPanelProps) {
    super(props);
    this.state = {
      currentTab: "contents",
      chapters: [],
      searchState: "",
      searchList: null,
      startIndex: 0,
      currentIndex: 0,
      cover: "",
      isCoverExist: false,
    };
  }
  handleNavSearchState = (state: string) => {
    this.setState({ searchState: state });
    if (state) {
      this.props.handleSearch(true);
    } else {
      if (ConfigService.getReaderConfig("isNavLocked") !== "yes") {
        this.props.handleSearch(false);
      }
    }
  };
  handleSearchList = (searchList: any) => {
    this.setState({ searchList });
  };
  async componentDidMount() {
    this.props.handleFetchBookmarks();
    this.setState({
      cover: await CoverUtil.getCover(this.props.currentBook),
      isCoverExist: await CoverUtil.isCoverExist(this.props.currentBook),
    });
  }

  handleChangeTab = (currentTab: string) => {
    this.setState({ currentTab });
  };
  handleLock = () => {
    this.props.handleNavLock(!this.props.isNavLocked);
    ConfigService.setReaderConfig(
      "isNavLocked",
      !this.props.isNavLocked ? "yes" : "no"
    );
    BookUtil.reloadBooks();
  };
  renderBeforeSearch = () => {
    if (this.state.searchState === "searching") {
      return (
        <div className="loading-animation search-animation">
          <div className="loader"></div>
        </div>
      );
    } else {
      return null;
    }
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
      .map((item: any) => {
        return (
          <li
            className="nav-search-list-item"
            key={item.text}
            onClick={async () => {
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
              let style = "background: #f3a6a68c;";
              this.props.htmlBook.rendition.highlightSearchNode(
                bookLocation.keyword,
                style
              );
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
      mode: this.state.searchState ? "" : "nav",
      width: "100px",
      height: "35px",
      isNavSearch: this.state.searchState,
      handleNavSearchState: this.handleNavSearchState,
      handleSearchList: this.handleSearchList,
    };
    const bookmarkProps = {
      currentTab: this.state.currentTab,
    };
    return (
      <div
        className="navigation-panel"
        style={{
          backgroundColor: this.props.isNavLocked
            ? ConfigService.getReaderConfig("backgroundColor")
            : "",
          color: this.props.isNavLocked
            ? ConfigService.getReaderConfig("textColor")
            : "",
        }}
      >
        {this.state.searchState ? (
          <>
            <div
              className="nav-close-icon"
              onClick={() => {
                this.handleNavSearchState("");
                this.props.handleSearch(false);
                this.setState({ searchList: null });
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
              <SearchBox {...searchProps} />
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
            <ul className="nav-search-page">
              {this.state.searchList ? this.renderSearchPage() : null}
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
