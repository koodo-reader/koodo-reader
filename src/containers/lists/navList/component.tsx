import React from "react";
import "./navList.css";
import { Trans } from "react-i18next";
import { NavListProps, NavListState } from "./interface";
import DeleteIcon from "../../../components/deleteIcon";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { classes, colors, lines } from "../../../constants/themeList";
import DatabaseService from "../../../utils/storage/databaseService";
import Book from "../../../models/Book";
import Bookmark from "../../../models/Bookmark";
import Note from "../../../models/Note";
class NavList extends React.Component<NavListProps, NavListState> {
  constructor(props: NavListProps) {
    super(props);
    this.state = {
      deleteIndex: -1,
      currentData: [],
    };
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
    if (
      nextProps.currentTab !== this.props.currentTab ||
      nextProps.currentBook.key !== this.props.currentBook.key ||
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
  async handleCurrentDataUpdate(
    currentTab: string,
    currentBook: Book,
    bookmarks: Bookmark[],
    notes: Note[],
    highlights: Note[]
  ) {
    if (currentTab === "bookmarks") {
      this.setState({
        currentData: bookmarks
          .filter((item) => item.bookKey === currentBook.key)
          .reverse(),
      });
    } else if (currentTab === "notes") {
      let noteList = notes.filter((item) => item.bookKey === currentBook.key);
      let fullNotes: any[] = [];
      for (let i = 0; i < noteList.length; i++) {
        let note = await DatabaseService.getRecord(noteList[i].key, "notes");
        if (note) {
          fullNotes.push(note);
        }
      }
      this.setState({
        currentData: fullNotes,
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
      this.setState({
        currentData: fullHighlights,
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
  convertColorCode = (color: string) => {
    let colorType = color.split("-")[0];
    let colorIndex = parseInt(color.split("-")[1]);
    return colorType === "color"
      ? { backgroundColor: colors[colorIndex], color: "#000" }
      : {
          borderBottom: `2px solid ${lines[colorIndex]}`,
          display: "inline",
        };
  };
  render() {
    const renderBookNavList = () => {
      return this.state.currentData.map((item: any, index: number) => {
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
              }}
              onClick={async () => {
                await this.handleJump(item.cfi);
              }}
            >
              <p
                className="book-bookmark-digest"
                style={
                  item.color !== undefined && item.color !== null
                    ? this.convertColorCode(classes[item.color])
                    : {}
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
              <DeleteIcon {...bookmarkProps} />
            ) : null}
          </li>
        );
      });
    };
    if (!this.state.currentData[0]) {
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
