import React from "react";
import "./popupOption.css";
import localforage from "localforage";
import Digest from "../../model/Digest";

import { Trans } from "react-i18next";
import { PopupOptionProps } from "./interface";
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
    let percentage = this.props.currentEpub.locations.percentageFromCfi(cfi);
    //获取章节名
    let index = this.props.chapters.findIndex((item: any) => {
      return item.spinePos > epub.renderer.currentChapter.spinePos;
    });
    let chapter = this.props.chapters[index]
      ? this.props.chapters[index].label.trim(" ")
      : "Unknown";
    // let chapter = epub.renderer.currentChapter.spinePos;

    let digest = new Digest(bookKey, chapter, text, cfi, percentage);
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
              <span className="icon-copy1 copy-icon"></span>
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

export default PopupOption;
