import { useTranslation } from "react-i18next";

import "./popupOption.css";

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
import { useAppStore } from "../../../store/useAppStore";

export interface PopupOptionProps {
  noteKey: string;
  rect: DOMRect;
  cfiRange: string;
  chapterDocIndex: number;
  chapter: string;
}

declare var window: any;

const highlightUtil: any = new HighlightUtil(ConfigService);

const PopupOption = (props: PopupOptionProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const highlight = useAppStore((s) => s.reader.highlight);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const handleOpenMenu = useAppStore((s) => s.handleOpenMenu);
  const handleNoteKey = useAppStore((s) => s.handleNoteKey);
  const handleMenuMode = useAppStore((s) => s.handleMenuMode);
  const handlePopupOptionDialog = useAppStore((s) => s.handlePopupOptionDialog);
  const handleSpeechDialog = useAppStore((s) => s.handleSpeechDialog);
  const handleSpeechStartText = useAppStore((s) => s.handleSpeechStartText);
  const handleSpeechAutoStart = useAppStore((s) => s.handleSpeechAutoStart);
  const handleFetchNotes = useAppStore((s) => s.handleFetchNotes);
  const handleOriginalText = useAppStore((s) => s.handleOriginalText);
  const handleOriginalSentence = useAppStore((s) => s.handleOriginalSentence);
  const handleQuoteText = useAppStore((s) => s.handleQuoteText);
  const { t } = useTranslation();
  const handleNote = () => {
    handleMenuMode("note");
    handleOpenMenu(true);
  };
  const handleCopy = () => {
    let text = getSelection(currentBook);
    if (!text) return;
    if (isReadingRawPDF(currentBook)) {
      text = text.split("\n").join(" ").trim();
    }
    let copied = false;
    const docs = getIframeDoc(currentBook);
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
    handleOpenMenu(false);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      doc.getSelection()?.empty();
    }
    toast.success(t("Copying successful"));
  };
  const handleTrans = () => {
    handleMenuMode("trans");
    handleOriginalText(getSelection(currentBook));
    handleOpenMenu(true);
  };
  const handleDict = () => {
    handleMenuMode("dict");
    handleOriginalText(getSelection(currentBook));
    handleOriginalSentence(
      getSelectionSentence(currentBook)
    );
    handleOpenMenu(true);
  };
  const handleDigest = async () => {
    await createHighlight({
      currentBook: currentBook,
      htmlBook: htmlBook,
      chapterDocIndex: props.chapterDocIndex,
      chapter: props.chapter,
      color: highlightUtil.formatHighlightValue(highlight),
      t: t,
      onNoteClick: handleNoteClick,
      onSuccess: () => {
        handleOpenMenu(false);
        handleFetchNotes();
        handleMenuMode("");
      },
    });
  };

  const handleNoteClick = (event: Event) => {
    handleNoteKey((event.target as any).dataset.key);
    handleMenuMode("note");
    handleOpenMenu(true);
  };
  const handleJump = (url: string) => {
    openExternalUrl(url);
  };
  const handleSearchInternet = () => {
    switch (ConfigService.getReaderConfig("searchEngine")) {
      case "google":
        handleJump(
          "https://www.google.com/search?q=" +
            getSelection(currentBook)
        );
        break;
      case "baidu":
        handleJump(
          "https://www.baidu.com/s?wd=" +
            getSelection(currentBook)
        );
        break;
      case "bing":
        handleJump(
          "https://www.bing.com/search?q=" +
            getSelection(currentBook)
        );
        break;
      case "duckduckgo":
        handleJump(
          "https://duckduckgo.com/?q=" +
            getSelection(currentBook)
        );
        break;
      case "yandex":
        handleJump(
          "https://yandex.com/search/?text=" +
            getSelection(currentBook)
        );
        break;
      case "yahoo":
        handleJump(
          "https://search.yahoo.com/search?p=" +
            getSelection(currentBook)
        );
        break;
      case "naver":
        handleJump(
          "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=1&ie=utf8&query=" +
            getSelection(currentBook)
        );
        break;
      case "baike":
        handleJump(
          "https://baike.baidu.com/item/" +
            getSelection(currentBook)
        );
        break;
      case "wiki":
        handleJump(
          "https://en.wikipedia.org/wiki/" +
            getSelection(currentBook)
        );
        break;
      default:
        handleJump(
          navigator.language === "zh-CN"
            ? "https://www.baidu.com/s?wd=" +
                getSelection(currentBook)
            : "https://www.google.com/search?q=" +
                getSelection(currentBook)
        );
        break;
    }
  };
  const handleSearchBook = () => {
    searchInTheBook("", currentBook, true);
    handleOpenMenu(false);
  };

  const handleSpeak = () => {
    var msg = new SpeechSynthesisUtterance();
    msg.text = getSelection(currentBook);
    if (window.speechSynthesis && window.speechSynthesis.getVoices) {
      msg.voice = window.speechSynthesis.getVoices()[0];
      window.speechSynthesis.speak(msg);
    }
  };

  const handleReadFromHere = () => {
    const text =
      getSelectionSentence(currentBook) ||
      getSelection(currentBook);
    if (!text) return;

    handleSpeechStartText(text);
    handleSpeechAutoStart(true);
    handleSpeechDialog(true);
    handleOpenMenu(false);
  };

  const handleAssistant = () => {
    const text = getSelection(currentBook);
    if (!text) return;

    handleQuoteText(text);
    handleMenuMode("assistant");
    handleOpenMenu(true);
  };

  const handleOpenPopupOptionDialog = () => {
    handleOpenMenu(false);
    handlePopupOptionDialog(true);
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

  const isFixedLayout = isFixedLayoutBook(currentBook);
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
                data-tooltip-content={t(item.title)}
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
            data-tooltip-content={t("Customize popup menu")}
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
