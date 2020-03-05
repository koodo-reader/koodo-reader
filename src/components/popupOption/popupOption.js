import React, { Component } from "react";
import "./popupOption.css";
import { connect } from "react-redux";
import localforage from "localforage";
import Digest from "../../model/Digest";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux.js";

import {
  handleOpenNote,
  handleOpenHighlight,
  handleOpenMenu
} from "../../redux/viewArea.redux";
class PopupOption extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleNote = () => {
    this.props.changeMenu("note");
  };
  handleHighlight = () => {
    this.props.changeMenu("highlight");
  };
  handleCopy = () => {
    // let selection = this.props.selection;
    // console.log(selection);
    let iDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    let text = iDoc.execCommand("copy", false, null);
    !text
      ? console.log("failed to copy text to clipboard")
      : console.log("copied!");
    this.props.closeMenu();
    iDoc.getSelection().empty();
    this.props.handleMessage("复制成功");
    this.props.handleMessageBox(true);
  };
  handleDigest = () => {
    let book = this.props.currentBook;
    let epub = this.props.currentEpub;
    let iframe = document.getElementsByTagName("iframe")[0];
    let iDoc = iframe.contentDocument;
    let sel = iDoc.getSelection();
    let range = sel.getRangeAt(0);

    let text = sel.toString();
    text = text && text.trim();
    let cfiBase = epub.renderer.currentChapter.cfiBase;
    let cfi = new window.EPUBJS.EpubCFI().generateCfiFromRange(range, cfiBase);
    let bookKey = book.key;

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

    let digest = new Digest(bookKey, chapter, text, cfi);
    let digestArr = this.props.digests ? this.props.digests : [];
    digestArr.push(digest);
    localforage.setItem("digests", digestArr);
    this.props.closeMenu();
    iDoc.getSelection().empty();
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
  };
  // return note;};
  render() {
    const renderMenuList = () => {
      return (
        <div className="menu-list">
          <div
            className="note-option"
            onClick={() => {
              this.handleNote();
            }}
          >
            <div>
              <span className="icon-note note-icon"></span>
              <p>记笔记</p>
            </div>
          </div>
          <div
            className="digest-option"
            onClick={() => {
              this.handleDigest();
            }}
          >
            <div>
              <span className="icon-collect digest-icon"></span>
              <p>收藏</p>
            </div>
          </div>
          <div
            className="highlight-option"
            onClick={() => {
              this.handleHighlight();
            }}
          >
            <div>
              <span className="icon-highlight highlight-icon"></span>
              <p>高亮</p>
            </div>
          </div>
          <div
            className="copy-option icon"
            onClick={() => {
              this.handleCopy();
            }}
          >
            <div>
              <span className="icon-copy copy-icon"></span>
              <p>复制</p>
            </div>
          </div>
        </div>
      );
    };
    return renderMenuList();
  }
}
const mapStateToProps = state => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    // locations: state.progressPanel.locations
    isOpenMenu: state.viewArea.isOpenMenu,
    selection: state.viewArea.selection,
    digests: state.reader.digests,
    chapters: state.reader.chapters
  };
};
const actionCreator = {
  handleOpenNote,
  handleOpenHighlight,
  handleOpenMenu,
  handleMessageBox,
  handleMessage
};
PopupOption = connect(mapStateToProps, actionCreator)(PopupOption);
export default PopupOption;
