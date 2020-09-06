import React from "react";
import "./popupOption.css";
import localforage from "localforage";
import Note from "../../model/Note";
import { Trans } from "react-i18next";
import { PopupOptionProps } from "./interface";
import ColorOption from "../colorOption";
import RecordLocation from "../../utils/recordLocation";

declare var window: any;

class PopupOption extends React.Component<PopupOptionProps> {
  handleNote = () => {
    this.props.handleChangeDirection(false);
    this.props.handleMenuMode("note");
    let rect = this.props.rect;
    let x = rect.x % this.props.currentEpub.rendition._layout.width;
    let y = rect.y % this.props.currentEpub.rendition._layout.height;
    let height = 200;
    let posX = x + rect.width / 2 - 20;
    //防止menu超出图书
    let rightEdge = this.props.currentEpub.rendition._layout.width - 200;
    var posY;
    //控制menu方向
    if (y < height) {
      this.props.handleChangeDirection(true);
      posY = y + 77;
    } else {
      posY = y - height / 2 - rect.height;
    }

    posY = posY < 6 ? 6 : posY;
    posX = posX < 10 ? 10 : x > rightEdge ? rightEdge : posX;

    let popupMenu = document.querySelector(".popup-menu-container");
    popupMenu &&
      popupMenu.setAttribute("style", `left:${posX}px;top:${posY}px`);
  };
  handleCopy = () => {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let text = doc.execCommand("copy", false);
    !text
      ? console.log("failed to copy text to clipboard")
      : console.log("copied!");
    this.props.handleOpenMenu(false);
    doc.getSelection()!.empty();
    this.props.handleMessage("Copy Successfully");
    this.props.handleMessageBox(true);
  };
  handleTrans = () => {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let sel = doc.getSelection();
    if (!sel) return;
    let text = sel.toString();
    text = text && text.trim();
    this.props.handleMenuMode("trans");
    this.props.handleOriginalText(text);
  };
  handleDigest = () => {
    let bookKey = this.props.currentBook.key;
    const currentLocation = this.props.currentEpub.rendition.currentLocation();
    let chapterHref = currentLocation.start.href;
    let chapterIndex = currentLocation.start.index;
    let chapter = "Unknown Chapter";
    let currentChapter = this.props.flattenChapters.filter(
      (item: any) => item.href.split("#")[0] === chapterHref
    )[0];
    if (currentChapter) {
      chapter = currentChapter.label.trim(" ");
    }
    const cfi = RecordLocation.getCfi(this.props.currentBook.key).cfi;

    let percentage =
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? 0
        : RecordLocation.getCfi(this.props.currentBook.key).percentage;
    let color = this.props.color;
    let notes = "";
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let charRange = window.rangy
      .getSelection(iframe)
      .saveCharacterRanges(doc.body)[0];
    let range = JSON.stringify(charRange);
    let text = doc.getSelection()?.toString();
    if (!text) return;
    text = text.replace(/\s\s/g, "");
    text = text.replace(/\r/g, "");
    text = text.replace(/\n/g, "");
    text = text.replace(/\t/g, "");
    text = text.replace(/\f/g, "");
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
                <span className="icon-copy copy-icon"></span>
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
