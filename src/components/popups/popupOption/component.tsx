import React from "react";
import "./popupOption.css";
import localforage from "localforage";
import Note from "../../../model/Note";
import { PopupOptionProps } from "./interface";
import ColorOption from "../../colorOption";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import { Tooltip } from "react-tippy";
import { popupList } from "../../../constants/popupList";
import StorageUtil from "../../../utils/storageUtil";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import { getSelection } from "../../../utils/mouseEvent";
import copy from "copy-text-to-clipboard";
import { getHightlightCoords } from "../../../utils/fileUtils/pdfUtil";

declare var window: any;

class PopupOption extends React.Component<PopupOptionProps> {
  handleNote = () => {
    this.props.handleChangeDirection(false);
    this.props.handleMenuMode("note");
    this.handleEdge();
  };
  handleEdge = () => {
    let page: any = { offsetLeft: 0 };
    if (this.props.currentBook.format !== "PDF") {
      page = document.getElementById("page-area");
      if (!page.clientWidth) return;
    }
    let popupMenu: any = document.querySelector(".popup-menu-container");
    let posX = popupMenu?.style.left;
    let posY = popupMenu?.style.top;
    posX = parseInt(posX.substr(0, posX.length - 2));
    posY = parseInt(posY.substr(0, posY.length - 2));
    let rightEdge = this.props.pageWidth - 310 + page.offsetLeft * 2;

    if (posX > rightEdge) {
      popupMenu.setAttribute("style", `left:${rightEdge}px;top:${posY}px`);
    }
  };
  handleCopy = () => {
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    copy(getSelection());
    this.props.handleOpenMenu(false);
    doc.getSelection()?.empty();
    toast.success(this.props.t("Copy Successfully"));
  };
  handleTrans = () => {
    this.props.handleMenuMode("trans");
    this.props.handleOriginalText(getSelection() || "");
    this.handleEdge();
  };
  handleDigest = () => {
    let bookKey = this.props.currentBook.key;
    let cfi = "";
    if (this.props.currentBook.format === "EPUB") {
      cfi = RecordLocation.getCfi(this.props.currentBook.key).cfi;
    } else if (this.props.currentBook.format === "PDF") {
      cfi = JSON.stringify(
        RecordLocation.getPDFLocation(this.props.currentBook.md5)
      );
    } else {
      cfi = JSON.stringify(
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
      );
    }
    let percentage = RecordLocation.getCfi(this.props.currentBook.key)
      .percentage
      ? RecordLocation.getCfi(this.props.currentBook.key).percentage
      : 0;
    let color = this.props.color;
    let notes = "";
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let charRange;
    if (this.props.currentBook.format !== "PDF") {
      charRange = window.rangy
        .getSelection(iframe)
        .saveCharacterRanges(doc.body)[0];
    }
    let range =
      this.props.currentBook.format === "PDF"
        ? JSON.stringify(getHightlightCoords())
        : JSON.stringify(charRange);
    let text = doc.getSelection()?.toString();
    if (!text) return;
    text = text.replace(/\s\s/g, "");
    text = text.replace(/\r/g, "");
    text = text.replace(/\n/g, "");
    text = text.replace(/\t/g, "");
    text = text.replace(/\f/g, "");
    let digest = new Note(
      bookKey,
      this.props.chapter,
      this.props.chapterIndex,
      text,
      cfi,
      range,
      notes,
      percentage,
      color,
      []
    );
    let noteArr = this.props.notes;
    noteArr.push(digest);
    localforage.setItem("notes", noteArr).then(() => {
      this.props.handleOpenMenu(false);
      toast.success(this.props.t("Add Successfully"));
      this.props.handleFetchNotes();
      this.props.handleMenuMode("highlight");
    });
    // let classes = [
    //   "color-0",
    //   "color-1",
    //   "color-2",
    //   "color-3",
    //   "line-0",
    //   "line-1",
    //   "line-2",
    //   "line-3",
    // ];
    // if (this.props.currentBook.format === "PDF") {
    //   showHighlight(JSON.parse(range), classes[color]);
    // }
  };
  handleJump = (url: string) => {
    isElectron
      ? window.require("electron").shell.openExternal(url)
      : window.open(url);
  };
  handleSearchInternet = () => {
    switch (StorageUtil.getReaderConfig("searchEngine")) {
      case "google":
        this.handleJump("https://www.google.com/search?q=" + getSelection());
        break;
      case "baidu":
        this.handleJump("https://www.baidu.com/s?wd=" + getSelection());
        break;
      case "bing":
        this.handleJump("https://www.bing.com/search?q=" + getSelection());
        break;
      case "duckduckgo":
        this.handleJump("https://duckduckgo.com/?q=" + getSelection());
        break;
      case "yandex":
        this.handleJump("https://yandex.com/search/?text=" + getSelection());
        break;
      case "yahoo":
        this.handleJump("https://search.yahoo.com/search?p=" + getSelection());
        break;
      default:
        this.handleJump(
          navigator.language === "zh-CN"
            ? "https://www.baidu.com/s?wd=" + getSelection()
            : "https://www.google.com/search?q=" + getSelection()
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
    searchBox.value = getSelection() || "";
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
    msg.text = getSelection() || "";
    msg.voice = window.speechSynthesis.getVoices()[0];
    window.speechSynthesis.speak(msg);
  };
  render() {
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
                        this.handleSearchInternet();
                        break;
                      case 6:
                        this.handleSpeak();
                        break;

                      default:
                        break;
                    }
                  }}
                >
                  <Tooltip
                    title={this.props.t(item.title)}
                    position="top"
                    trigger="mouseenter"
                  >
                    <span
                      className={`icon-${item.icon} ${item.name}-icon`}
                    ></span>
                  </Tooltip>
                </div>
              );
            })}
          </div>
          <ColorOption />
        </>
      );
    };
    return renderMenuList();
  }
}

export default PopupOption;
