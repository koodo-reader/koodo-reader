import React, { Component } from "react";
import "./popupNote.css";
import { connect } from "react-redux";
import Note from "../../model/Note";
import localforage from "localforage";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux.js";
class PopupNote extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  createNote() {
    // let { book, epub } = this.props;
    let book = this.props.currentBook;
    let epub = this.props.currentEpub;
    let iframe = document.getElementsByTagName("iframe")[0];
    let iDoc = iframe.contentDocument;
    let sel = iDoc.getSelection();
    let range = sel.getRangeAt(0);
    // console.log(range, "range");
    let notes = document.querySelector(".editor-box").value;
    // let notes = editor.;
    document.querySelector(".editor-box").value = "";
    // console.log(notes, "note");
    let text = sel.toString();
    text = text && text.trim();
    let cfiBase = epub.renderer.currentChapter.cfiBase;
    let cfi = new window.EPUBJS.EpubCFI().generateCfiFromRange(range, cfiBase);
    let bookKey = book.key;
    let charRange = window.rangy
      .getSelection(iframe)
      .saveCharacterRanges(iDoc.body)[0];
    let serial = JSON.stringify(charRange);
    //获取章节名
    let index = this.props.chapters.findIndex(item => {
      return item.spinePos > epub.renderer.currentChapter.spinePos;
    });
    // console.log(index, "sahathth");
    let chapter =
      this.props.chapters[index] !== undefined
        ? this.props.chapters[index].label.trim(" ")
        : "未知章节";
    // let chapter = epub.renderer.currentChapter.spinePos;

    let note = new Note(bookKey, chapter, text, cfi, serial, notes);
    let noteArr = this.props.notes ? this.props.notes : [];
    noteArr.push(note);
    localforage.setItem("notes", noteArr);
    this.props.closeMenu();
    iDoc.getSelection().empty();
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
    this.props.changeMenu("menu");
    // return note;
  }
  handleReturn = () => {
    this.props.changeMenu("menu");
    // this.props.openMenu();
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
            <textarea
              type="text"
              className="editor-box"
              placeholder="请在此输入您的笔记"
            />
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
const mapStateToProps = state => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    notes: state.reader.notes,
    chapters: state.reader.chapters
  };
};
const actionCreator = { handleMessageBox, handleMessage };
PopupNote = connect(mapStateToProps, actionCreator)(PopupNote);
export default PopupNote;
