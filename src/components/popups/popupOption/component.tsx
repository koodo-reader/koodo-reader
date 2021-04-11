//选中文字后的弹窗，四个按钮
import React from "react";
import "./popupOption.css";
import localforage from "localforage";
import Note from "../../../model/Note";
import { NamespacesConsumer } from "react-i18next";
import { PopupOptionProps } from "./interface";
import ColorOption from "../../colorOption";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import { Tooltip } from "react-tippy";
import { popupList } from "../../../constants/popupList";
import OtherUtil from "../../../utils/otherUtil";
import { isElectron } from "react-device-detect";

declare var window: any;
const getSelection = () => {
  let iframe = document.getElementsByTagName("iframe")[0];
  if (!iframe) return;
  let doc = iframe.contentDocument;
  if (!doc) return;
  let sel = doc.getSelection();
  if (!sel) return;
  let text = sel.toString();
  text = text && text.trim();
  return text;
};

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
    this.props.handleMenuMode("trans");
    this.props.handleOriginalText(getSelection() || "");
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

    let percentage = RecordLocation.getCfi(this.props.currentBook.key)
      .percentage
      ? RecordLocation.getCfi(this.props.currentBook.key).percentage
      : 0;
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
      color,
      []
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
  handleJump = (url: string) => {
    isElectron
      ? window.require("electron").shell.openExternal(url)
      : window.open(url);
  };
  handleSearchInternet = () => {
    switch (OtherUtil.getReaderConfig("searchEngine")) {
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
    leftPanel!.dispatchEvent(clickEvent);
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
        <NamespacesConsumer>
          {(t) => (
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
                        title={t(item.title)}
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
          )}
        </NamespacesConsumer>
      );
    };
    return renderMenuList();
  }
}

export default PopupOption;
