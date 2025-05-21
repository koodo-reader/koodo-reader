import React from "react";
import "./cardList.css";
import NoteModel from "../../../models/Note";
import { Trans } from "react-i18next";
import { CardListProps, CardListStates } from "./interface";
import DeleteIcon from "../../../components/deleteIcon";
import { withRouter } from "react-router-dom";
import { Redirect } from "react-router-dom";
import NoteTag from "../../../components/noteTag";
import BookUtil from "../../../utils/file/bookUtil";
import toast from "react-hot-toast";
import BookModel from "../../../models/Book";
import {
  ConfigService,
  SortUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
class CardList extends React.Component<CardListProps, CardListStates> {
  constructor(props: CardListProps) {
    super(props);
    this.state = { deleteKey: "" };
  }
  handleBookName = (bookKey: string) => {
    let { books } = this.props;
    let bookName = "";
    for (let i = 0; i < this.props.books.length; i++) {
      if (books[i].key === bookKey) {
        bookName = books[i].name;
        break;
      }
    }
    return bookName;
  };
  handleShowDelete = (deleteKey: string) => {
    this.setState({ deleteKey });
  };
  handleJump = (note: NoteModel) => {
    let { books } = this.props;
    let book: BookModel | null = null;
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === note.bookKey) {
        book = books[i];
        break;
      }
    }
    if (!book) {
      toast(this.props.t("Book not exists"));
      return;
    }

    let bookLocation: any = {};
    //compatile wiht lower version(1.4.2)
    try {
      bookLocation = JSON.parse(note.cfi) || {};
    } catch (error) {
      bookLocation.cfi = note.cfi;
      bookLocation.chapterTitle = note.chapter;
    }
    ConfigService.setObjectConfig(note.bookKey, bookLocation, "recordLocation");

    BookUtil.redirectBook(book);
  };
  render() {
    let { cards } = this.props;
    if (cards.length === 0) {
      return <Redirect to="/manager/empty" />;
    }

    let noteObj = SortUtil.sortNotes(
      cards,
      this.props.noteSortCode,
      this.props.books
    );
    const renderCardListItem = (title: string) => {
      return noteObj![title].map((item: NoteModel, index: number) => {
        const cardProps = {
          itemKey: item.key,
          mode: "notes",
        };
        return (
          <li
            className="card-list-item"
            key={index}
            onMouseOver={() => {
              this.handleShowDelete(item.key);
            }}
            onMouseLeave={() => {
              this.handleShowDelete("");
            }}
            style={
              this.props.mode === "note" && !this.props.isCollapsed
                ? { height: "250px" }
                : this.props.mode === "note" && this.props.isCollapsed
                ? { height: "250px", width: "calc(50vw - 70px)" }
                : this.props.isCollapsed
                ? { width: "calc(50vw - 70px)" }
                : {}
            }
          >
            <div className="card-list-item-card">
              <div style={{ position: "relative", bottom: "25px" }}>
                {this.state.deleteKey === item.key ? (
                  <DeleteIcon {...cardProps} />
                ) : null}
              </div>
              <div className="card-list-item-text-parent">
                <div className="card-list-item-note">
                  {this.props.mode === "note" ? item.notes : item.text}
                </div>
              </div>
              {this.props.mode === "note" ? (
                <div className="card-list-item-text-note">
                  <div className="card-list-item-text">{item.text}</div>
                </div>
              ) : null}

              <div className="card-list-item-citation">
                <div className="card-list-item-title">
                  <Trans>From</Trans>《
                </div>
                <div className="card-list-item-chapter card-list-item-title">
                  {this.handleBookName(item.bookKey)}
                </div>
                <div className="card-list-item-chapter card-list-item-title">
                  》{item.chapter}
                </div>
              </div>
              <div
                className="note-tags"
                style={{
                  position: "absolute",
                  bottom: "60px",
                  height: "30px",
                  overflow: "hidden",
                }}
              >
                <NoteTag
                  {...{
                    handleTag: () => {},
                    tag: item.tag || [],
                    isCard: true,
                  }}
                />
              </div>
              <div className="card-list-item-show-more-container">
                <span
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={this.props.t("Show in the book")}
                >
                  <span
                    className="icon-idea-line"
                    style={{
                      fontSize: "22px",
                      marginRight: "15px",
                      marginLeft: "15px",
                      fontWeight: 400,
                    }}
                    onClick={() => {
                      this.handleJump(item);
                    }}
                  ></span>
                </span>
                <span
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={this.props.t("Edit")}
                >
                  <span
                    className="icon-edit-line"
                    style={{ fontSize: "22px" }}
                    onClick={() => {
                      this.props.handleNoteKey(item.key);
                      this.props.handleShowPopupNote(true);
                    }}
                  ></span>
                </span>
              </div>
            </div>
          </li>
        );
      });
    };
    const renderCardList = () => {
      return Object.keys(noteObj!).map((item, index) => {
        return (
          <li className="card-page-item" key={index}>
            <div className="card-page-item-date">{item}</div>
            <ul className="card-list-container-box">
              {renderCardListItem(item)}
            </ul>
          </li>
        );
      });
    };
    return <div className="card-list-container">{renderCardList()}</div>;
  }
}

export default withRouter(CardList as any);
