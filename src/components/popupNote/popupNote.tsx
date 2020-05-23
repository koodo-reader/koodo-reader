import React from "react";
import "./popupNote.css";
import { connect } from "react-redux";
import Note from "../../model/Note";
import localforage from "localforage";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { handleOpenMenu, handleMenuMode } from "../../redux/actions/viewArea";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import { stateType } from "../../redux/store";
import { Trans } from "react-i18next";
import { withNamespaces } from "react-i18next";

declare var window: any;
export interface PopupNoteProps {
  currentEpub: any;
  currentBook: BookModel;
  notes: NoteModel[];
  chapters: any;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
}

class PopupNote extends React.Component<PopupNoteProps> {
  createNote() {
    // let { book, epub } = this.props;
    if (
      !document.getElementsByTagName("iframe")[0] ||
      !document.getElementsByTagName("iframe")[0].contentDocument
    ) {
      return;
    }
    let book = this.props.currentBook;
    let epub = this.props.currentEpub;
    let iframe = document.getElementsByTagName("iframe")[0];
    let iDoc = iframe.contentDocument;
    let sel = iDoc!.getSelection();
    let range = sel!.getRangeAt(0);
    let notes = (document.querySelector(".editor-box") as HTMLInputElement)
      .value;
    (document.querySelector(".editor-box") as HTMLInputElement).value = "";
    let text = sel!.toString();
    text = text && text.trim();
    let cfiBase = epub.renderer.currentChapter.cfiBase;
    let cfi = new window.EPUBJS.EpubCFI().generateCfiFromRange(range, cfiBase);
    let bookKey = book.key;
    let charRange = window.rangy
      .getSelection(iframe)
      .saveCharacterRanges(iDoc!.body)[0];
    let serial = JSON.stringify(charRange);
    //获取章节名
    let index = this.props.chapters.findIndex((item: any) => {
      return item.spinePos > epub.renderer.currentChapter.spinePos;
    });
    let chapter =
      this.props.chapters[index] !== undefined
        ? this.props.chapters[index].label.trim(" ")
        : "Unknown";
    let note = new Note(bookKey, chapter, text, cfi, serial, notes);
    let noteArr = this.props.notes ? this.props.notes : [];
    noteArr.push(note);
    localforage.setItem("notes", noteArr);
    this.props.handleOpenMenu(false);
    iDoc!.getSelection()!.empty();
    this.props.handleMessage("Add Successfully");
    this.props.handleMessageBox(true);
    this.props.handleMenuMode("menu");
    // return note;
  }
  handleReturn = () => {
    this.props.handleMenuMode("menu");
  };
  handleClose = () => {
    this.props.handleOpenMenu(false);
    this.props.handleMenuMode("menu");
  };

  render() {
    const renderNoteEditor = () => {
      return (
        <div className="note-editor">
          <div
            className="note-return-button"
            onClick={() => {
              this.handleReturn();
            }}
          >
            <span className="icon-return"></span>
          </div>
          <div className="editor-box-parent">
            <textarea className="editor-box" placeholder="请在此输入您的笔记" />
          </div>
          <div className="note-button-container">
            <span
              className="confirm-button"
              onClick={() => {
                this.createNote();
              }}
            >
              <Trans>Confirm</Trans>
            </span>
            <span
              className="cancel-button"
              onClick={() => {
                this.handleClose();
              }}
            >
              <Trans>Cancel</Trans>
            </span>
          </div>
        </div>
      );
    };
    return renderNoteEditor();
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    notes: state.reader.notes,
    chapters: state.reader.chapters,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleOpenMenu,
  handleMenuMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(PopupNote as any));
