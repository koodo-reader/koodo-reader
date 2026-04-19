import React from "react";
import "./popupOption.css";

import { PopupOptionProps } from "./interface";
import ColorOption from "../../colorOption";
import { popupList } from "../../../constants/popupList";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import {
  getSelection,
  getSelectionSentence,
  searchInTheBook,
} from "../../../utils/reader/mouseEvent";
import copy from "copy-text-to-clipboard";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import { openExternalUrl } from "../../../utils/common";
import { createHighlight } from "../../../utils/reader/noteUtil";

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
    this.props.handleOriginalSentence(
      getSelectionSentence(this.props.currentBook.format)
    );
  };
  handleDigest = async () => {
    await createHighlight({
      currentBook: this.props.currentBook,
      htmlBook: this.props.htmlBook,
      chapterDocIndex: this.props.chapterDocIndex,
      chapter: this.props.chapter,
      color: this.props.color,
      t: this.props.t,
      onNoteClick: this.handleNoteClick,
      onSuccess: () => {
        this.props.handleOpenMenu(false);
        this.props.handleFetchNotes();
        this.props.handleMenuMode("");
      },
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
    searchInTheBook("", this.props.currentBook.format, true);
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
