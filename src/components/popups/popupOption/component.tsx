
import "./popupOption.css";

import { PopupOptionProps } from "./interface";
import {
  getEnabledPopupOptionKeys,
  popupOptionMap,
  PopupOptionKey,
} from "../../../constants/popupList";
import {
  ConfigService,
  HighlightUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import {
  getSelection,
  getSelectionSentence,
  searchInTheBook,
} from "../../../utils/reader/mouseEvent";
import copy from "copy-text-to-clipboard";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import {
  isFixedLayoutBook,
  isReadingRawPDF,
  openExternalUrl,
} from "../../../utils/common";
import { createHighlight } from "../../../utils/reader/noteUtil";
import { Tooltip } from "react-tooltip";

declare var window: any;

const highlightUtil: any = new HighlightUtil(ConfigService);

const PopupOption = (props: PopupOptionProps) => {
  const handleNote = () => {
    props.handleMenuMode("note");
    props.handleOpenMenu(true);
  };
  const handleCopy = () => {
    let text = getSelection(props.currentBook);
    if (!text) return;
    if (isReadingRawPDF(props.currentBook)) {
      text = text.split("\n").join(" ").trim();
    }
    let copied = false;
    const docs = getIframeDoc(props.currentBook);
    for (let i = 0; i < docs.length && !copied; i++) {
      const doc = docs[i];
      if (!doc) continue;
      const sel = doc.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.toString().trim()) continue;
      copied = doc.execCommand("copy");
    }
    if (!copied) {
      copy(text);
    }
    props.handleOpenMenu(false);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      doc.getSelection()?.empty();
    }
    toast.success(props.t("Copying successful"));
  };
  const handleTrans = () => {
    props.handleMenuMode("trans");
    props.handleOriginalText(getSelection(props.currentBook));
    props.handleOpenMenu(true);
  };
  const handleDict = () => {
    props.handleMenuMode("dict");
    props.handleOriginalText(getSelection(props.currentBook));
    props.handleOriginalSentence(
      getSelectionSentence(props.currentBook)
    );
    props.handleOpenMenu(true);
  };
  const handleDigest = async () => {
    await createHighlight({
      currentBook: props.currentBook,
      htmlBook: props.htmlBook,
      chapterDocIndex: props.chapterDocIndex,
      chapter: props.chapter,
      color: highlightUtil.formatHighlightValue(props.highlight),
      t: props.t,
      onNoteClick: handleNoteClick,
      onSuccess: () => {
        props.handleOpenMenu(false);
        props.handleFetchNotes();
        props.handleMenuMode("");
      },
    });
  };

  const handleNoteClick = (event: Event) => {
    props.handleNoteKey((event.target as any).dataset.key);
    props.handleMenuMode("note");
    props.handleOpenMenu(true);
  };
  const handleJump = (url: string) => {
    openExternalUrl(url);
  };
  const handleSearchInternet = () => {
    switch (ConfigService.getReaderConfig("searchEngine")) {
      case "google":
        handleJump(
          "https://www.google.com/search?q=" +
            getSelection(props.currentBook)
        );
        break;
      case "baidu":
        handleJump(
          "https://www.baidu.com/s?wd=" +
            getSelection(props.currentBook)
        );
        break;
      case "bing":
        handleJump(
          "https://www.bing.com/search?q=" +
            getSelection(props.currentBook)
        );
        break;
      case "duckduckgo":
        handleJump(
          "https://duckduckgo.com/?q=" +
            getSelection(props.currentBook)
        );
        break;
      case "yandex":
        handleJump(
          "https://yandex.com/search/?text=" +
            getSelection(props.currentBook)
        );
        break;
      case "yahoo":
        handleJump(
          "https://search.yahoo.com/search?p=" +
            getSelection(props.currentBook)
        );
        break;
      case "naver":
        handleJump(
          "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=1&ie=utf8&query=" +
            getSelection(props.currentBook)
        );
        break;
      case "baike":
        handleJump(
          "https://baike.baidu.com/item/" +
            getSelection(props.currentBook)
        );
        break;
      case "wiki":
        handleJump(
          "https://en.wikipedia.org/wiki/" +
            getSelection(props.currentBook)
        );
        break;
      default:
        handleJump(
          navigator.language === "zh-CN"
            ? "https://www.baidu.com/s?wd=" +
                getSelection(props.currentBook)
            : "https://www.google.com/search?q=" +
                getSelection(props.currentBook)
        );
        break;
    }
  };
  const handleSearchBook = () => {
    searchInTheBook("", props.currentBook, true);
    props.handleOpenMenu(false);
  };

  const handleSpeak = () => {
    var msg = new SpeechSynthesisUtterance();
    msg.text = getSelection(props.currentBook);
    if (window.speechSynthesis && window.speechSynthesis.getVoices) {
      msg.voice = window.speechSynthesis.getVoices()[0];
      window.speechSynthesis.speak(msg);
    }
  };

  const handleReadFromHere = () => {
    const text =
      getSelectionSentence(props.currentBook) ||
      getSelection(props.currentBook);
    if (!text) return;

    props.handleSpeechStartText(text);
    props.handleSpeechAutoStart(true);
    props.handleSpeechDialog(true);
    props.handleOpenMenu(false);
  };

  const handleAssistant = () => {
    const text = getSelection(props.currentBook);
    if (!text) return;

    props.handleQuoteText(text);
    props.handleMenuMode("assistant");
    props.handleOpenMenu(true);
  };

  const handleOpenPopupOptionDialog = () => {
    props.handleOpenMenu(false);
    props.handlePopupOptionDialog(true);
  };

  const handleOptionClick = (optionKey: PopupOptionKey) => {
    switch (optionKey) {
      case "note":
        handleNote();
        break;
      case "highlight":
        handleDigest();
        break;
      case "translation":
        handleTrans();
        break;
      case "copy":
        handleCopy();
        break;
      case "search-book":
        handleSearchBook();
        break;
      case "dict":
        handleDict();
        break;
      case "browser":
        handleSearchInternet();
        break;
      case "speaker":
        handleSpeak();
        break;
      case "speech-start":
        handleReadFromHere();
        break;
      case "assistant":
        handleAssistant();
        break;
      default:
        break;
    }
  };

  const isFixedLayout = isFixedLayoutBook(props.currentBook);
    const popupOptionKeys = getEnabledPopupOptionKeys().filter((item) => {
      if (
        item === "assistant" &&
        ConfigService.getReaderConfig("isDisableAI") === "yes"
      ) {
        return false;
      }
      if (isFixedLayout && (item === "note" || item === "highlight")) {
        return false;
      }
      return true;
    });
    return (
      <div className="menu-list">
        <Tooltip id="option-tooltip" style={{ zIndex: 25 }} />
        {popupOptionKeys.map((itemKey) => {
          const item = popupOptionMap[itemKey];
          return (
            <div
              key={item.key}
              className={item.name + "-option"}
              onClick={() => {
                handleOptionClick(item.key);
              }}
            >
              <span
                data-tooltip-id="option-tooltip"
                data-tooltip-content={props.t(item.title)}
              >
                <span
                  className={`icon-${item.icon} ${item.name}-icon`}
                  style={{ pointerEvents: "none" }}
                ></span>
              </span>
            </div>
          );
        })}
        <div
          className="setting-option"
          onClick={() => {
            handleOpenPopupOptionDialog();
          }}
        >
          <span
            data-tooltip-id="option-tooltip"
            data-tooltip-content={props.t("Customize popup menu")}
          >
            <span
              className="icon-setting setting-icon"
              style={{ color: "#8a8f9f", fontSize: "20px" }}
            ></span>
          </span>
        </div>
      </div>
  );
};

export default PopupOption;
