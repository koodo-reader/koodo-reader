import { useEffect, useRef, useState } from "react";
import "./popupMenu.css";
import { isFixedLayoutBook, isPaginatedBook } from "../../../utils/common";
import PopupOption from "../popupOption";
import ColorOption from "../../colorOption";
import { PopupMenuProps } from "./interface";
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

declare var window: any;

const MENU_WIDTH = 252;
const MENU_HEIGHT = 141;
const highlightUtil: any = new HighlightUtil(ConfigService);

const PopupMenu = (props: PopupMenuProps) => {
  const [rect, setRect] = useState(props.rect);
  const prevRectRef = useRef(props.rect);

  const showMenu = (menuRect: any = rect) => {
    if (!menuRect) return;
    let { posX, posY } = getHtmlPosition(menuRect);
    props.handleOpenMenu(true);
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
      props.readerMode !== "scroll"
    ) {
      props.handleChangeDirection(true);
      posY = menuRect.top + 16 + pageSize.top;
    } else if (
      pageSize.height - menuRect.height < MENU_HEIGHT &&
      pageSize.height - menuRect.height > -10
    ) {
      props.handleChangeDirection(true);
      posY = menuRect.top - pageSize.scrollTop + 16;
    } else if (
      menuRect.height - pageSize.height > 0 &&
      props.readerMode === "scroll"
    ) {
      posY = 40;
    } else if (posY < pageSize.height - MENU_HEIGHT + pageSize.top) {
      props.handleChangeDirection(true);
      posY = posY + 16 + pageSize.top;
    } else {
      posY = posY - menuRect.height - MENU_HEIGHT + pageSize.top;
    }
    posX = posX - MENU_WIDTH / 2 + pageSize.left;
    if (
      isPaginatedBook(props.currentBook) &&
      props.readerMode === "double" &&
      props.chapterDocIndex % 2 === 1
    ) {
      posX = posX + pageSize.sectionWidth + pageSize.gap;
    }
    if (
      isPaginatedBook(props.currentBook) &&
      props.readerMode === "scroll" &&
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
      props.readerMode === "scroll" &&
      props.currentBook.format === "PDF"
    ) {
      posX = posX - pageSize.scrollLeft;
    }
    return {
      posX: Math.min(Math.max(12, posX), window.innerWidth - 12 - MENU_WIDTH),
      posY,
    } as any;
  };

  const openMenu = (menuRect?: any) => {
    let docs = getIframeDoc(props.currentBook);
    let sel: Selection | null = null;
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      if (isPaginatedBook(props.currentBook)) {
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
    props.handleChangeDirection(false);
    if (props.isOpenMenu) {
      props.handleMenuMode("");
      props.handleOpenMenu(false);
      props.handleNoteKey("");
    }
    if (!sel) return;
    if (sel.isCollapsed) {
      props.isOpenMenu && props.handleOpenMenu(false);
      props.handleMenuMode("menu");
      props.handleNoteKey("");
      return;
    }

    const selectAction = ConfigService.getReaderConfig("selectAction");
    if (selectAction && selectAction !== "") {
      handleSelectAction(selectAction, sel);
      return;
    }

    showMenu(menuRect);
    props.handleMenuMode("menu");
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
      currentBook: props.currentBook,
      htmlBook: props.htmlBook,
      chapterDocIndex: props.chapterDocIndex,
      chapter: props.chapter,
      color: highlightUtil.formatHighlightValue(props.highlight),
      t: props.t,
      onNoteClick: (event: Event) => {
        props.handleNoteKey((event.target as any).dataset.key);
        props.handleMenuMode("note");
        props.handleOpenMenu(true);
      },
      onSuccess: () => {
        props.handleOpenMenu(false);
        props.handleFetchNotes();
        props.handleMenuMode("");
      },
    });
  };

  const handleSelectAction = async (action: string, _sel: Selection) => {
    const text = getSelection(props.currentBook);
    if (!text) return;
    if (
      (action === "note" || action === "highlight") &&
      isFixedLayoutBook(props.currentBook)
    ) {
      showMenu();
      props.handleMenuMode("menu");
      return;
    }

    switch (action) {
      case "translation":
        props.handleOriginalText(text);
        props.handleMenuMode("trans");
        props.handleOpenMenu(true);
        break;
      case "dict":
        props.handleOriginalText(text);
        props.handleOriginalSentence(
          getSelectionSentence(props.currentBook)
        );
        props.handleMenuMode("dict");
        props.handleOpenMenu(true);
        break;
      case "highlight":
        await createHighlight({
          currentBook: props.currentBook,
          htmlBook: props.htmlBook,
          chapterDocIndex: props.chapterDocIndex,
          chapter: props.chapter,
          color: highlightUtil.formatHighlightValue(props.highlight),
          t: props.t,
          onSuccess: () => {
            props.handleOpenMenu(false);
          },
        });
        break;
      case "note":
        props.handleMenuMode("note");
        showMenu();
        props.handleOpenMenu(true);
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
        props.handleMenuMode("menu");
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
        style={props.isOpenMenu ? {} : { display: "none" }}
      >
        <div
          className="popup-menu-box"
          style={props.menuMode === "menu" ? {} : { display: "none" }}
        >
          <PopupOption {...(PopupProps as any)} />
        </div>
        <div
          className="popup-color-box"
          style={
            props.menuMode === "menu" &&
            !isFixedLayoutBook(props.currentBook)
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
