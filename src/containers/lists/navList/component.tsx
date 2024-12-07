import React from "react";
import "./navList.css";
import { Trans } from "react-i18next";
import { NavListProps, NavListState } from "./interface";
import DeleteIcon from "../../../components/deleteIcon";
import toast from "react-hot-toast";
import ConfigService from "../../../utils/storage/configService";
class NavList extends React.Component<NavListProps, NavListState> {
  constructor(props: NavListProps) {
    super(props);
    this.state = {
      deleteIndex: -1,
    };
  }
  componentDidMount(): void {
    this.props.htmlBook.rendition.on("rendered", () => {
      this.handleDisplayBookmark();
    });
  }
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
  handleDisplayBookmark() {
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
    this.props.bookmarks.forEach((item) => {
      if (item.cfi === JSON.stringify(bookLocation)) {
        this.props.handleShowBookmark(true);
      }
    });
  }
  handleShowDelete = (index: number) => {
    this.setState({ deleteIndex: index });
  };
  render() {
    let currentData: any = (
      (this.props.currentTab === "bookmarks"
        ? this.props.bookmarks
        : this.props.currentTab === "notes"
        ? this.props.notes.filter((item) => item.notes !== "")
        : this.props.digests) as any
    ).filter((item: any) => {
      return item.bookKey === this.props.currentBook.key;
    });
    const renderBookNavList = () => {
      return currentData.reverse().map((item: any, index: number) => {
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
            <p className="book-bookmark-digest">
              {this.props.currentTab === "bookmarks"
                ? item.label
                : this.props.currentTab === "notes"
                ? item.notes
                : item.text}
            </p>
            <div className="bookmark-page-list-item-title">
              <Trans>{item.chapter}</Trans>
            </div>
            <div className="book-bookmark-progress">
              {Math.floor(item.percentage * 100)}%
            </div>
            {this.state.deleteIndex === index ? (
              <DeleteIcon {...bookmarkProps} />
            ) : null}
            <div
              className="book-bookmark-link"
              onClick={async () => {
                await this.handleJump(item.cfi);
              }}
              style={{ cursor: "pointer" }}
            >
              <Trans>Go to</Trans>
            </div>
          </li>
        );
      });
    };
    if (!currentData[0]) {
      return (
        <div className="navigation-panel-empty-bookmark">
          <Trans>Empty</Trans>
        </div>
      );
    }
    return (
      <div className="book-bookmark-container">
        <ul className="book-bookmark">{renderBookNavList()}</ul>
      </div>
    );
  }
}

export default NavList;
