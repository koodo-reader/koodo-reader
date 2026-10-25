import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import "./popupMenu.css";
import { isFixedLayoutBook, isPaginatedBook } from "../../../utils/common";
import PopupOption from "../popupOption";
import ColorOption from "../../colorOption";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import {
  ConfigService,
  HighlightUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  getSelection,
  getSelectionSentence,
} from "../../../utils/reader/mouseEvent";
import { createHighlight } from "../../../utils/reader/noteUtil";
import { useAppStore } from "../../../store/useAppStore";

export interface PopupMenuProps {
  rendition: any;
  // cfiRange: any;
  rect: any;

  chapterDocIndex: number;
  chapter: string;
}

declare var window: any;

const MENU_WIDTH = 252;
const MENU_HEIGHT = 141;
const highlightUtil: any = new HighlightUtil(ConfigService);

const PopupMenu = (props: PopupMenuProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const isOpenMenu = useAppStore((s) => s.viewArea.isOpenMenu);
  const menuMode = useAppStore((s) => s.viewArea.menuMode);
  const readerMode = useAppStore((s) => s.reader.readerMode);
  const highlight = useAppStore((s) => s.reader.highlight);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const handleOpenMenu = useAppStore((s) => s.handleOpenMenu);
  const handleMenuMode = useAppStore((s) => s.handleMenuMode);
  const handleChangeDirection = useAppStore((s) => s.handleChangeDirection);
  const handleNoteKey = useAppStore((s) => s.handleNoteKey);
  const handleOriginalText = useAppStore((s) => s.handleOriginalText);
  const handleOriginalSentence = useAppStore((s) => s.handleOriginalSentence);
  const handleFetchNotes = useAppStore((s) => s.handleFetchNotes);
  const { t } = useTranslation();
  const [rect, setRect] = useState(props.rect);
  const prevRectRef = useRef(props.rect);

  const showMenu = (menuRect: any = rect) => {
    if (!menuRect) return;
    let { posX, posY } = getHtmlPosition(menuRect);
    handleOpenMenu(true);
    let popupMenu = document.querySelector(".popup-menu-container");
    popupMenu?.setAttribute("style", `left:${posX}px;top:${posY}px`);
  };

  const getHtmlPosition = (menuRect: any) => {
    let pageSize = props.rendition.getPageSize(props.chapterDocIndex);
    let posY = menuRect.bottom - pageSize.scrollTop;
    let posX = menuRect.left + menuRect.width / 2;
    if (menuRect.width > pageSize.sectionWidth && menuRect.left < 0) {
      posX = menuRect.left + menuRect.width;
    }
    if (
      menuRect.top < MENU_HEIGHT &&
      pageSize.height - menuRect.top - menuRect.height < MENU_HEIGHT &&
      readerMode !== "scroll"
    ) {
      handleChangeDirection(true);
      posY = menuRect.top + 16 + pageSize.top;
    } else if (
      pageSize.height - menuRect.height < MENU_HEIGHT &&
      pageSize.height - menuRect.height > -10
    ) {
      handleChangeDirection(true);
      posY = menuRect.top - pageSize.scrollTop + 16;
    } else if (
      menuRect.height - pageSize.height > 0 &&
      readerMode === "scroll"
    ) {
      posY = 40;
    } else if (posY < pageSize.height - MENU_HEIGHT + pageSize.top) {
      handleChangeDirection(true);
      posY = posY + 16 + pageSize.top;
    } else {
      posY = posY - menuRect.height - MENU_HEIGHT + pageSize.top;
    }
    posX = posX - MENU_WIDTH / 2 + pageSize.left;
    if (
      isPaginatedBook(currentBook) &&
      readerMode === "double" &&
      props.chapterDocIndex % 2 === 1
    ) {
      posX = posX + pageSize.sectionWidth + pageSize.gap;
    }
    if (
      isPaginatedBook(currentBook) &&
      readerMode === "scroll" &&
      posY < 0
    ) {
      posY = posY + pageSize.offsetTop;
    }
    if (posY < 0) {
      posY = 16;
    }
    if (posY > pageSize.height - MENU_HEIGHT) {
      posY = pageSize.height - MENU_HEIGHT;
    }
    if (
      readerMode === "scroll" &&
      currentBook.format === "PDF"
    ) {
      posX = posX - pageSize.scrollLeft;
    }
    return {
      posX: Math.min(Math.max(12, posX), window.innerWidth - 12 - MENU_WIDTH),
      posY,
    } as any;
  };

  const openMenu = (menuRect?: any) => {
    let docs = getIframeDoc(currentBook);
    let sel: Selection | null = null;
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      if (isPaginatedBook(currentBook)) {
        let targetIframe = doc?.defaultView?.frameElement;
        let id = targetIframe?.getAttribute("id") || "";
        let chapterDocIndex = id ? parseInt(id.split("-").reverse()[0]) : 0;
        if (chapterDocIndex !== props.chapterDocIndex) {
          continue;
        }
      }

      sel = doc.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        break;
      }
    }
    handleChangeDirection(false);
    if (isOpenMenu) {
      handleMenuMode("");
      handleOpenMenu(false);
      handleNoteKey("");
    }
    if (!sel) return;
    if (sel.isCollapsed) {
      isOpenMenu && handleOpenMenu(false);
      handleMenuMode("menu");
      handleNoteKey("");
      return;
    }

    const selectAction = ConfigService.getReaderConfig("selectAction");
    if (selectAction && selectAction !== "") {
      handleSelectAction(selectAction, sel);
      return;
    }

    showMenu(menuRect);
    handleMenuMode("menu");
  };

  useEffect(() => {
    if (prevRectRef.current !== props.rect) {
      prevRectRef.current = props.rect;
      setRect(props.rect);
      openMenu(props.rect);
    }
  }, [props.rect]);

  const handleDigest = async () => {
    await createHighlight({
      currentBook: currentBook,
      htmlBook: htmlBook,
      chapterDocIndex: props.chapterDocIndex,
      chapter: props.chapter,
      color: highlightUtil.formatHighlightValue(highlight),
      t: t,
      onNoteClick: (event: Event) => {
        handleNoteKey((event.target as any).dataset.key);
        handleMenuMode("note");
        handleOpenMenu(true);
      },
      onSuccess: () => {
        handleOpenMenu(false);
        handleFetchNotes();
        handleMenuMode("");
      },
    });
  };

  const handleSelectAction = async (action: string, _sel: Selection) => {
    const text = getSelection(currentBook);
    if (!text) return;
    if (
      (action === "note" || action === "highlight") &&
      isFixedLayoutBook(currentBook)
    ) {
      showMenu();
      handleMenuMode("menu");
      return;
    }

    switch (action) {
      case "translation":
        handleOriginalText(text);
        handleMenuMode("trans");
        handleOpenMenu(true);
        break;
      case "dict":
        handleOriginalText(text);
        handleOriginalSentence(
          getSelectionSentence(currentBook)
        );
        handleMenuMode("dict");
        handleOpenMenu(true);
        break;
      case "highlight":
        await createHighlight({
          currentBook: currentBook,
          htmlBook: htmlBook,
          chapterDocIndex: props.chapterDocIndex,
          chapter: props.chapter,
          color: highlightUtil.formatHighlightValue(highlight),
          t: t,
          onSuccess: () => {
            handleOpenMenu(false);
          },
        });
        break;
      case "note":
        handleMenuMode("note");
        showMenu();
        handleOpenMenu(true);
        break;
      case "speaker":
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        if (window.speechSynthesis && window.speechSynthesis.getVoices) {
          msg.voice = window.speechSynthesis.getVoices()[0];
          window.speechSynthesis.speak(msg);
        }
        break;
      default:
        showMenu();
        handleMenuMode("menu");
        break;
    }
  };

  const PopupProps = {
    chapterDocIndex: props.chapterDocIndex,
    chapter: props.chapter,
  };
  const ColorProps = {
    handleDigest: handleDigest,
  };
  return (
    <div>
      <div
        className="popup-menu-container"
        style={isOpenMenu ? {} : { display: "none" }}
      >
        <div
          className="popup-menu-box"
          style={menuMode === "menu" ? {} : { display: "none" }}
        >
          <PopupOption {...(PopupProps as any)} />
        </div>
        <div
          className="popup-color-box"
          style={
            menuMode === "menu" &&
            !isFixedLayoutBook(currentBook)
              ? {}
              : { display: "none" }
          }
        >
          <ColorOption {...(ColorProps as any)} />
        </div>
      </div>
    </div>
  );
};

export default PopupMenu;
