import React from "react";
import "./navList.css";
import { Trans } from "react-i18next";
import { NavListProps, NavListState } from "./interface";
import DeleteIcon from "../../../components/deleteIcon";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { classes, colors, lines } from "../../../constants/themeList";
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
  convertColorCode = (color: string) => {
    let colorType = color.split("-")[0];
    let colorIndex = parseInt(color.split("-")[1]);
    return colorType === "color"
      ? { backgroundColor: colors[colorIndex] }
      : {
          borderBottom: `2px solid ${lines[colorIndex]}`,
          display: "inline",
        };
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
            <div
              style={{
                margin: "5px",
                marginTop: "10px",
                marginBottom: "10px",
                width: "100%",
                maxHeight: "198px",
              }}
            >
              <p
                className="book-bookmark-digest"
                style={
                  item.color !== undefined && item.color !== null
                    ? this.convertColorCode(classes[item.color])
                    : {}
                }
                onClick={async () => {
                  await this.handleJump(item.cfi);
                }}
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

            <div className="bookmark-page-list-item-title">
              <Trans>{item.chapter}</Trans>
            </div>
            <div className="book-bookmark-progress">
              {Math.floor(item.percentage * 100)}%
            </div>
            {this.state.deleteIndex === index ? (
              <DeleteIcon {...bookmarkProps} />
            ) : null}
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
