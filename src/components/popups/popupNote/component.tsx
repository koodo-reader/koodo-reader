import React from "react";
import "./popupNote.css";
import Note from "../../../models/Note";
import _ from "underscore";
import { PopupNoteProps, PopupNoteState } from "./interface";
import NoteTag from "../../noteTag";
import NoteModel from "../../../models/Note";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../../utils/storage/databaseService";
import ColorOption from "../../colorOption";
import copy from "copy-text-to-clipboard";
class PopupNote extends React.Component<PopupNoteProps, PopupNoteState> {
  constructor(props: PopupNoteProps) {
    super(props);
    this.state = { tag: [], text: "" };
  }
  componentDidMount() {
    let textArea: any = document.querySelector(".editor-box");
    textArea && textArea.focus();
    if (this.props.noteKey) {
      let noteIndex = _.findLastIndex(this.props.notes, {
        key: this.props.noteKey,
      });
      this.setState({
        text: this.props.notes[noteIndex].text,
      });
      textArea.value = this.props.notes[noteIndex].notes;
    } else {
      let docs = getIframeDoc(this.props.currentBook.format);
      let text = "";
      for (let i = 0; i < docs.length; i++) {
        let doc = docs[i];
        if (!doc) continue;
        text = doc.getSelection()?.toString() || "";
        if (text) {
          break;
        }
      }
      if (!text) return;

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
  async createNote() {
    let notes = (document.querySelector(".editor-box") as HTMLInputElement)
      .value;

    if (this.props.noteKey) {
      this.props.notes.forEach((item) => {
        if (item.key === this.props.noteKey) {
          item.notes = notes;
          item.tag = this.state.tag;
          item.color = this.props.color || item.color;
        }
      });
      let newNote = this.props.notes.filter(
        (item) => item.key === this.props.noteKey
      )[0];
      DatabaseService.updateRecord(newNote, "notes").then(() => {
        this.props.handleOpenMenu(false);
        toast.success(this.props.t("Addition successful"));
        this.props.handleFetchNotes();
        this.props.handleMenuMode("");
        this.props.handleNoteKey("");
        this.props.handleShowPopupNote(false);
        if (this.props.htmlBook.rendition) {
          this.props.htmlBook.rendition.removeOneNote(
            this.props.noteKey,
            this.props.chapterDocIndex
          );
          this.props.htmlBook.rendition.createOneNote(
            newNote,
            this.handleNoteClick
          );
        }
      });
    } else {
      let cfi = JSON.stringify(
        ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "recordLocation",
          {}
        )
      );
      if (
        this.props.currentBook.format === "PDF" &&
        ConfigService.getReaderConfig("isConvertPDF") !== "yes"
      ) {
        let bookLocation = this.props.htmlBook.rendition.getPositionByChapter(
          this.props.chapterDocIndex
        );
        cfi = JSON.stringify(bookLocation);
      }
      let bookKey = this.props.currentBook.key;
      let range = JSON.stringify(
        await this.props.htmlBook.rendition.getHightlightCoords(
          this.props.chapterDocIndex
        )
      );

      let percentage = ConfigService.getObjectConfig(
        this.props.currentBook.key,
        "recordLocation",
        {}
      ).percentage
        ? ConfigService.getObjectConfig(
            this.props.currentBook.key,
            "recordLocation",
            {}
          ).percentage
        : "0";

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
      DatabaseService.saveRecord(note, "notes").then(async () => {
        this.props.handleOpenMenu(false);
        toast.success(this.props.t("Addition successful"));
        this.props.handleFetchNotes();
        this.props.handleMenuMode("");
        await this.props.htmlBook.rendition.createOneNote(
          note,
          this.handleNoteClick
        );
      });
    }
  }
  handleUpdateHighlight = (color: number) => {};
  handleClose = () => {
    if (this.props.noteKey) {
      DatabaseService.deleteRecord(this.props.noteKey, "notes").then(() => {
        toast.success(this.props.t("Deletion successful"));
        this.props.handleMenuMode("");
        this.props.handleFetchNotes();
        this.props.handleNoteKey("");
        if (this.props.htmlBook.rendition) {
          this.props.htmlBook.rendition.removeOneNote(
            this.props.noteKey,
            this.props.chapterDocIndex
          );
        }

        this.props.handleOpenMenu(false);
        this.props.handleShowPopupNote(false);
      });
    } else {
      this.props.handleOpenMenu(false);
      this.props.handleMenuMode("");
      this.props.handleNoteKey("");
    }
  };

  render() {
    const PopupProps = {
      handleDigest: this.handleUpdateHighlight,
      isEdit: true,
    };
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
          <ColorOption {...PopupProps} />
          <div className="note-button-container">
            <span
              className="book-manage-title"
              onClick={() => {
                copy(this.state.text);
                toast.success(this.props.t("Copying successful"));
              }}
            >
              <Trans>Copy quotes</Trans>
            </span>
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
