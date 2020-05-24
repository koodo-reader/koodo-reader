import React from "react";
import "./popupOption.css";
import { connect } from "react-redux";
import localforage from "localforage";
import Digest from "../../model/Digest";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { handleOpenMenu, handleMenuMode } from "../../redux/actions/viewArea";

import BookModel from "../../model/Book";
import DigestModel from "../../model/Digest";
import { stateType } from "../../redux/store";
import { Trans, withNamespaces } from "react-i18next";

export interface PopupOptionProps {
  currentBook: BookModel;
  currentEpub: any;
  selection: string;
  digests: DigestModel[];
  chapters: any;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
}
class PopupOption extends React.Component<PopupOptionProps> {
  handleNote = () => {
    this.props.handleMenuMode("note");
  };
  handleHighlight = () => {
    this.props.handleMenuMode("highlight");
  };
  handleCopy = () => {
    if (
      !document.getElementsByTagName("iframe")[0] ||
      !document.getElementsByTagName("iframe")[0].contentDocument
    ) {
      return;
    }
    let iDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    let text = iDoc!.execCommand("copy", false);
    !text
      ? console.log("failed to copy text to clipboard")
      : console.log("copied!");
    this.props.handleOpenMenu(false);
    iDoc!.getSelection()!.empty();
    this.props.handleMessage("Copy Successfully");
    this.props.handleMessageBox(true);
  };
  handleDigest = () => {
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

    let text = sel!.toString();
    text = text && text.trim();
    let cfiBase = epub.renderer.currentChapter.cfiBase;
    let cfi = new (window as any).EPUBJS.EpubCFI().generateCfiFromRange(
      range,
      cfiBase
    );
    let bookKey = book.key;

    //获取章节名
    let index = this.props.chapters.findIndex((item: any) => {
      return item.spinePos > epub.renderer.currentChapter.spinePos;
    });
    // console.log(index, "sahathth");
    let chapter =
      this.props.chapters[index] !== undefined
        ? this.props.chapters[index].label.trim(" ")
        : "Unknown";
    // let chapter = epub.renderer.currentChapter.spinePos;

    let digest = new Digest(bookKey, chapter, text, cfi);
    let digestArr = this.props.digests ? this.props.digests : [];
    digestArr.push(digest);
    localforage.setItem("digests", digestArr);
    this.props.handleOpenMenu(false);
    iDoc!.getSelection()!.empty();
    this.props.handleMessage("Add Successfully");
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
              <p>
                <Trans>Take Notes</Trans>
              </p>
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
              <p>
                <Trans>Collect</Trans>
              </p>
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
              <p>
                <Trans>Highlight</Trans>
              </p>
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
              <p>
                <Trans>Copy</Trans>
              </p>
            </div>
          </div>
        </div>
      );
    };
    return renderMenuList();
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    selection: state.viewArea.selection,
    digests: state.reader.digests,
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
)(withNamespaces()(PopupOption as any));
