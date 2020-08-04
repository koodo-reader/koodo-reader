import React from "react";
import "./popupOption.css";
import localforage from "localforage";
import Note from "../../model/Note";
import { Trans } from "react-i18next";
import { PopupOptionProps } from "./interface";
import ColorOption from "../colorOption";

declare var window: any;

class PopupOption extends React.Component<PopupOptionProps> {
  handleNote = () => {
    this.props.handleMenuMode("note");
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
  handleTrans = () => {
    if (
      !document.getElementsByTagName("iframe")[0] ||
      !document.getElementsByTagName("iframe")[0].contentDocument
    ) {
      return;
    }
    let iframe = document.getElementsByTagName("iframe")[0];
    let iDoc = iframe.contentDocument;
    let sel = iDoc!.getSelection();
    let text = sel!.toString();
    text = text && text.trim();
    this.props.handleMenuMode("trans");
    this.props.handleOriginalText(text);
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
    let rangeBefore = sel!.getRangeAt(0);

    let text = sel!.toString();
    text = text && text.trim();
    let cfiBase = epub.renderer.currentChapter.cfiBase;
    let cfi = new (window as any).EPUBJS.EpubCFI().generateCfiFromRange(
      rangeBefore,
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
    let chapterIndex = this.props.currentEpub.renderer.currentChapter.spinePos;
    let charRange = window.rangy
      .getSelection(iframe)
      .saveCharacterRanges(iDoc!.body)[0];
    let range = JSON.stringify(charRange);
    let color = this.props.color;
    let notes = "";
    let digest = new Note(
      bookKey,
      chapter,
      chapterIndex,
      text,
      cfi,
      range,
      notes,
      percentage,
      color
    );
    let noteArr = this.props.notes;
    noteArr.push(digest);
    localforage.setItem("notes", noteArr).then(() => {
      this.props.handleOpenMenu(false);
      this.props.handleMessage("Add Successfully");
      this.props.handleMessageBox(true);
      this.props.handleFetchNotes();
      this.props.handleMenuMode("highlight");
    });
  };

  render() {
    const renderMenuList = () => {
      return (
        <>
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
              className="translation-option"
              onClick={() => {
                this.handleTrans();
              }}
            >
              <div>
                <span className="icon-translation translation-icon"></span>
                <p>
                  <Trans>Translate</Trans>
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
          <ColorOption />
        </>
      );
    };
    return renderMenuList();
  }
}

export default PopupOption;
