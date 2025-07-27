import React from "react";
import "./popupOption.css";

import Note from "../../../models/Note";
import { PopupOptionProps } from "./interface";
import ColorOption from "../../colorOption";
import { popupList } from "../../../constants/popupList";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { getSelection } from "../../../utils/reader/mouseEvent";
import copy from "copy-text-to-clipboard";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import { openExternalUrl } from "../../../utils/common";
import DatabaseService from "../../../utils/storage/databaseService";

declare var window: any;

class PopupOption extends React.Component<PopupOptionProps> {
  handleNote = () => {
    // this.props.handleChangeDirection(false);
    this.props.handleMenuMode("note");
  };
  handleCopy = () => {
    let text = getSelection(this.props.currentBook.format);
    if (!text) return;
    if (
      this.props.currentBook.format === "PDF" &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
      text = text.split("\n").join(" ").trim();
    }
    copy(text);
    this.props.handleOpenMenu(false);
    let docs = getIframeDoc(this.props.currentBook.format);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      doc.getSelection()?.empty();
    }
    toast.success(this.props.t("Copying successful"));
  };
  handleTrans = () => {
    this.props.handleMenuMode("trans");
    this.props.handleOriginalText(getSelection(this.props.currentBook.format));
  };
  handleDict = () => {
    this.props.handleMenuMode("dict");
    this.props.handleOriginalText(getSelection(this.props.currentBook.format));
  };
  handleDigest = async () => {
    let bookKey = this.props.currentBook.key;
    let bookLocation = ConfigService.getObjectConfig(
      this.props.currentBook.key,
      "recordLocation",
      {}
    );
    let cfi = JSON.stringify(bookLocation);
    if (
      this.props.currentBook.format === "PDF" &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
      let bookLocation = this.props.htmlBook.rendition.getPositionByChapter(
        this.props.chapterDocIndex
      );
      cfi = JSON.stringify(bookLocation);
    }
    let percentage = bookLocation.percentage ? bookLocation.percentage : "0";
    let color = this.props.color;
    let notes = "";
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
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

    let range = JSON.stringify(
      await this.props.htmlBook.rendition.getHightlightCoords(
        this.props.chapterDocIndex
      )
    );
    if (!text) return;
    text = text.replace(/\s\s/g, "");
    text = text.replace(/\r/g, "");
    text = text.replace(/\n/g, "");
    text = text.replace(/\t/g, "");
    text = text.replace(/\f/g, "");
    let digest = new Note(
      bookKey,
      this.props.chapter,
      this.props.chapterDocIndex,
      text,
      cfi,
      range,
      notes,
      percentage,
      color,
      []
    );
    DatabaseService.saveRecord(digest, "notes").then(async () => {
      this.props.handleOpenMenu(false);
      toast.success(this.props.t("Addition successful"));
      this.props.handleFetchNotes();
      this.props.handleMenuMode("");
      await this.props.htmlBook.rendition.createOneNote(
        digest,
        this.handleNoteClick
      );
    });
  };

  handleNoteClick = (event: Event) => {
    this.props.handleNoteKey((event.target as any).dataset.key);
    this.props.handleMenuMode("note");
    this.props.handleOpenMenu(true);
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  handleSearchInternet = () => {
    switch (ConfigService.getReaderConfig("searchEngine")) {
      case "google":
        this.handleJump(
          "https://www.google.com/search?q=" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "baidu":
        this.handleJump(
          "https://www.baidu.com/s?wd=" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "bing":
        this.handleJump(
          "https://www.bing.com/search?q=" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "duckduckgo":
        this.handleJump(
          "https://duckduckgo.com/?q=" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "yandex":
        this.handleJump(
          "https://yandex.com/search/?text=" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "yahoo":
        this.handleJump(
          "https://search.yahoo.com/search?p=" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "naver":
        this.handleJump(
          "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=1&ie=utf8&query=" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "baike":
        this.handleJump(
          "https://baike.baidu.com/item/" +
            getSelection(this.props.currentBook.format)
        );
        break;
      case "wiki":
        this.handleJump(
          "https://en.wikipedia.org/wiki/" +
            getSelection(this.props.currentBook.format)
        );
        break;
      default:
        this.handleJump(
          navigator.language === "zh-CN"
            ? "https://www.baidu.com/s?wd=" +
                getSelection(this.props.currentBook.format)
            : "https://www.google.com/search?q=" +
                getSelection(this.props.currentBook.format)
        );
        break;
    }
  };
  handleSearchBook = () => {
    let leftPanel = document.querySelector(".left-panel");
    const clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    if (!leftPanel) return;
    leftPanel.dispatchEvent(clickEvent);
    const focusEvent = new MouseEvent("focus", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    let searchBox: any = document.querySelector(".header-search-box");
    searchBox.dispatchEvent(focusEvent);
    let searchIcon = document.querySelector(".header-search-icon");
    searchIcon?.dispatchEvent(clickEvent);
    searchBox.value = getSelection(this.props.currentBook.format);
    const keyEvent: any = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      keyCode: 13,
    } as any);
    searchBox.dispatchEvent(keyEvent);
    this.props.handleOpenMenu(false);
  };

  handleSpeak = () => {
    var msg = new SpeechSynthesisUtterance();
    msg.text = getSelection(this.props.currentBook.format);
    if (window.speechSynthesis && window.speechSynthesis.getVoices) {
      msg.voice = window.speechSynthesis.getVoices()[0];
      window.speechSynthesis.speak(msg);
    }
  };

  render() {
    const PopupProps = {
      handleDigest: this.handleDigest,
    };
    const renderMenuList = () => {
      return (
        <>
          <div className="menu-list">
            {popupList.map((item, index) => {
              return (
                <div
                  key={item.name}
                  className={item.name + "-option"}
                  onClick={() => {
                    switch (index) {
                      case 0:
                        this.handleNote();
                        break;
                      case 1:
                        this.handleDigest();
                        break;
                      case 2:
                        this.handleTrans();
                        break;
                      case 3:
                        this.handleCopy();
                        break;
                      case 4:
                        this.handleSearchBook();
                        break;
                      case 5:
                        this.handleDict();
                        break;
                      case 6:
                        this.handleSearchInternet();
                        break;
                      case 7:
                        this.handleSpeak();
                        break;
                      default:
                        break;
                    }
                  }}
                >
                  <span
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={this.props.t(item.title)}
                  >
                    <span
                      className={`icon-${item.icon} ${item.name}-icon`}
                    ></span>
                  </span>
                </div>
              );
            })}
          </div>
          <ColorOption {...PopupProps} />
        </>
      );
    };
    return renderMenuList();
  }
}

export default PopupOption;
