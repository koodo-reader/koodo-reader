import React from "react";
import "./popupNote.css";
import Note from "../../../models/Note";

import { PopupNoteProps, PopupNoteState } from "./interface";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import NoteTag from "../../noteTag";
import NoteModel from "../../../models/Note";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  getHightlightCoords,
  removePDFHighlight,
} from "../../../utils/fileUtils/pdfUtil";
import { getIframeDoc } from "../../../utils/serviceUtils/docUtil";
import {
  createOneNote,
  removeOneNote,
} from "../../../utils/serviceUtils/noteUtil";
import { classes } from "../../../constants/themeList";
declare var window: any;

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

  handleNoteClick = (event: Event) => {
    this.props.handleNoteKey((event.target as any).dataset.key);
    this.props.handleMenuMode("note");
    this.props.handleOpenMenu(true);
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
      this.props.notes.forEach((item) => {
        if (item.key === this.props.noteKey) {
          item.notes = notes;
          item.tag = this.state.tag;
          item.cfi = cfi;
        }
      });
      window.localforage.setItem("notes", this.props.notes).then(() => {
        this.props.handleOpenMenu(false);
        toast.success(this.props.t("Addition successful"));
        this.props.handleFetchNotes();
        this.props.handleMenuMode("");
        this.props.handleNoteKey("");
      });
    } else {
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
        toast.success(this.props.t("Addition successful"));
        this.props.handleFetchNotes();
        this.props.handleMenuMode("");
        createOneNote(
          note,
          this.props.currentBook.format,
          this.handleNoteClick
        );
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

          toast.success(this.props.t("Deletion successful"));
          this.props.handleMenuMode("");
          this.props.handleFetchNotes();
          this.props.handleNoteKey("");
          removeOneNote(note.key, this.props.currentBook.format);
          this.props.handleOpenMenu(false);
        });
      }
    } else {
      this.props.handleOpenMenu(false);
      this.props.handleMenuMode("");
      this.props.handleNoteKey("");
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
