import React from "react";
import "./popupNote.css";
import { connect } from "react-redux";
import Note from "../../model/Note";
import localforage from "localforage";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import { stateType } from "../../store";

declare var window: any;
export interface PopupNoteProps {
  currentEpub: any;
  currentBook: BookModel;
  notes: NoteModel[];
  chapters: any;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  changeMenu: (menu: string) => void;
  closeMenu: () => void;
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
        : "未知章节";
    let note = new Note(bookKey, chapter, text, cfi, serial, notes);
    let noteArr = this.props.notes ? this.props.notes : [];
    noteArr.push(note);
    localforage.setItem("notes", noteArr);
    this.props.closeMenu();
    iDoc!.getSelection()!.empty();
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
    this.props.changeMenu("menu");
    // return note;
  }
  handleReturn = () => {
    this.props.changeMenu("menu");
  };
  handleClose = () => {
    this.props.closeMenu();
    this.props.changeMenu("menu");
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

          <span
            className="confirm-button"
            onClick={() => {
              this.createNote();
            }}
          >
            确认
          </span>
          <span
            className="cancel-button"
            onClick={() => {
              this.handleClose();
            }}
          >
            取消
          </span>
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
const actionCreator = { handleMessageBox, handleMessage };
export default connect(mapStateToProps, actionCreator)(PopupNote);
