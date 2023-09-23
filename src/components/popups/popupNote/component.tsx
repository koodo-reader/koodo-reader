//添加笔记的弹窗
import React from "react";
import "./popupNote.css";
import Note from "../../../model/Note";

import { PopupNoteProps, PopupNoteState } from "./interface";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import NoteTag from "../../noteTag";
import NoteModel from "../../../model/Note";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  getHightlightCoords,
  removePDFHighlight,
} from "../../../utils/fileUtils/pdfUtil";
import { getIframeDoc } from "../../../utils/serviceUtils/docUtil";
import { renderHighlighters } from "../../../utils/serviceUtils/noteUtil";
declare var window: any;
let classes = [
  "color-0",
  "color-1",
  "color-2",
  "color-3",
  "line-0",
  "line-1",
  "line-2",
  "line-3",
];
class PopupNote extends React.Component<PopupNoteProps, PopupNoteState> {
  constructor(props: PopupNoteProps) {
    super(props);
    this.state = { tag: [], text: "" };
  }
  componentDidMount() {
    let textArea: any = document.querySelector(".editor-box");
    textArea && textArea.focus();
    if (this.props.noteKey) {
      let noteIndex = window._.findLastIndex(this.props.notes, {
        key: this.props.noteKey,
      });
      this.setState({
        text: this.props.notes[noteIndex].text,
      });
      textArea.value = this.props.notes[noteIndex].notes;
    } else {
      let doc = getIframeDoc();
      if (!doc) {
        return;
      }
      let text = doc.getSelection()?.toString();
      if (!text) {
        return;
      }
      text = text.replace(/\s\s/g, "");
      text = text.replace(/\r/g, "");
      text = text.replace(/\n/g, "");
      text = text.replace(/\t/g, "");
      text = text.replace(/\f/g, "");
      this.setState({ text });
    }
  }
  handleTag = (tag: string[]) => {
    this.setState({ tag });
  };
  handleHighlight = () => {
    let highlighters: any = this.props.notes;
    if (!highlighters) return;
    let highlightersByChapter = highlighters.filter((item: Note) => {
      if (this.props.currentBook.format !== "PDF") {
        return (
          item.chapter ===
            this.props.htmlBook.rendition.getChapterDoc()[
              this.props.chapterDocIndex
            ].label && item.bookKey === this.props.currentBook.key
        );
      } else {
        return (
          item.chapterIndex === this.props.chapterDocIndex &&
          item.bookKey === this.props.currentBook.key
        );
      }
    });
    renderHighlighters(
      highlightersByChapter,
      this.props.currentBook.format,
      this.handleNoteClick
    );
  };
  handleNoteClick = (event: Event) => {
    if (event && event.target) {
      this.props.handleNoteKey((event.target as any).dataset.key);
      this.props.handleMenuMode("note");
      this.props.handleOpenMenu(true);
    }
  };
  createNote() {
    let notes = (document.querySelector(".editor-box") as HTMLInputElement)
      .value;
    let cfi = "";
    if (this.props.currentBook.format === "PDF") {
      cfi = JSON.stringify(
        RecordLocation.getPDFLocation(this.props.currentBook.md5.split("-")[0])
      );
    } else {
      cfi = JSON.stringify(
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
      );
    }
    if (this.props.noteKey) {
      //编辑笔记
      this.props.notes.forEach((item) => {
        if (item.key === this.props.noteKey) {
          item.notes = notes;
          item.tag = this.state.tag;
          item.cfi = cfi;
        }
      });
      window.localforage.setItem("notes", this.props.notes).then(() => {
        this.props.handleOpenMenu(false);
        toast.success(this.props.t("Add Successfully"));
        this.props.handleFetchNotes();
        this.props.handleMenuMode("");
        this.props.handleNoteKey("");
        this.handleHighlight();
      });
    } else {
      //创建笔记
      let bookKey = this.props.currentBook.key;

      let pageArea = document.getElementById("page-area");
      if (!pageArea) return;
      let iframe = pageArea.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      let charRange;
      if (this.props.currentBook.format !== "PDF") {
        charRange = window.rangy
          .getSelection(iframe)
          .saveCharacterRanges(doc.body)[0];
      }

      let range =
        this.props.currentBook.format === "PDF"
          ? JSON.stringify(getHightlightCoords())
          : JSON.stringify(charRange);

      let percentage = 0;

      let color = this.props.color || 0;
      let tag = this.state.tag;

      let note = new Note(
        bookKey,
        this.props.chapter,
        this.props.chapterDocIndex,
        this.state.text,
        cfi,
        range,
        notes,
        percentage,
        color,
        tag
      );

      let noteArr = this.props.notes;
      noteArr.push(note);
      window.localforage.setItem("notes", noteArr).then(() => {
        this.props.handleOpenMenu(false);
        toast.success(this.props.t("Add Successfully"));
        this.props.handleFetchNotes();
        this.props.handleMenuMode("");
        this.handleHighlight();
      });
    }
  }
  handleClose = () => {
    let noteIndex = -1;
    let note: NoteModel;
    if (this.props.noteKey) {
      this.props.notes.forEach((item, index) => {
        if (item.key === this.props.noteKey) {
          noteIndex = index;
          note = item;
        }
      });
      if (noteIndex > -1) {
        this.props.notes.splice(noteIndex, 1);
        window.localforage.setItem("notes", this.props.notes).then(() => {
          if (this.props.currentBook.format === "PDF") {
            removePDFHighlight(
              JSON.parse(note.range),
              classes[note.color],
              note.key
            );
          }

          toast.success(this.props.t("Delete Successfully"));
          this.props.handleMenuMode("");
          this.props.handleFetchNotes();
          this.props.handleNoteKey("");
          this.handleHighlight();
          this.props.handleOpenMenu(false);
        });
      }
    } else {
      this.props.handleOpenMenu(false);
      this.props.handleMenuMode("");
      this.props.handleNoteKey("");
      this.handleHighlight();
    }
  };

  render() {
    let note: NoteModel;
    if (this.props.noteKey) {
      this.props.notes.forEach((item) => {
        if (item.key === this.props.noteKey) {
          note = item;
        }
      });
    }

    const renderNoteEditor = () => {
      return (
        <div className="note-editor">
          <div className="note-original-text">{this.state.text}</div>
          <div className="editor-box-parent">
            <textarea className="editor-box" />
          </div>
          <div
            className="note-tags"
            style={{ position: "absolute", bottom: "0px", height: "40px" }}
          >
            <NoteTag
              {...{
                handleTag: this.handleTag,
                tag: this.props.noteKey && note ? note.tag : [],
              }}
            />
          </div>

          <div className="note-button-container">
            <span
              className="book-manage-title"
              onClick={() => {
                this.handleClose();
              }}
            >
              {this.props.noteKey ? (
                <Trans>Delete</Trans>
              ) : (
                <Trans>Cancel</Trans>
              )}
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                this.createNote();
              }}
            >
              <Trans>Confirm</Trans>
            </span>
          </div>
        </div>
      );
    };
    return renderNoteEditor();
  }
}
export default PopupNote;
