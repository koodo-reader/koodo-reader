import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import "./cardList.css";
import NoteModel from "../../../models/Note";
import { Trans } from "react-i18next";
import { CardListProps } from "./interface";
import { Navigate } from "react-router-dom";
import BookUtil from "../../../utils/file/bookUtil";
import toast from "react-hot-toast";
import BookModel from "../../../models/Book";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../../utils/storage/databaseService";
import Note from "../../../models/Note";
import { useAppStore } from "../../../store/useAppStore";

const CardList = (props: CardListProps) => {
  const isCollapsed = useAppStore((s) => s.sidebar.isCollapsed);
  const chapters = useAppStore((s) => s.reader.chapters);
  const books = useAppStore((s) => s.manager.books);
  const noteSortCode = useAppStore((s) => s.manager.noteSortCode);
  const handleReadingBook = useAppStore((s) => s.handleReadingBook);
  const handleShowPopupNote = useAppStore((s) => s.handleShowPopupNote);
  const handleNoteKey = useAppStore((s) => s.handleNoteKey);
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<any>(null);
  const [state, setState] = useState<Record<string, any>>({
    displayedCards: [],
    currentPage: 1,
    itemsPerPage: 16,
    isLoading: false,
  });
  const stateRef = useLatest(state);
  const propsRef = useLatest(props);

  const loadInitialCards = async () => {
    let sortedCards = [...props.cards];
    const { itemsPerPage } = stateRef.current;

    const screenHeight = window.innerHeight;
    const adaptiveItemsPerPage =
      screenHeight > 800 ? itemsPerPage + 8 : itemsPerPage;
    let initialCards = sortedCards.slice(0, adaptiveItemsPerPage);
    let initialDisplayedCards: Note[] = [];
    for (let i = 0; i < initialCards.length; i++) {
      let card = await DatabaseService.getRecord(initialCards[i].key, "notes");
      if (card) {
        initialDisplayedCards.push(card);
      }
    }

    setState({
      displayedCards: initialDisplayedCards,
      currentPage: 1,
      isLoading: false,
      itemsPerPage: adaptiveItemsPerPage,
    });
  };

  const loadMoreCards = () => {
    let sortedCards = [...propsRef.current.cards];
    const { displayedCards, currentPage, itemsPerPage, isLoading } =
      stateRef.current;

    if (isLoading || displayedCards.length >= sortedCards.length) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    setTimeout(async () => {
      const nextPage = currentPage + 1;
      const startIndex = currentPage * itemsPerPage;
      const endIndex = nextPage * itemsPerPage;
      let newCards = sortedCards.slice(startIndex, endIndex);
      let newDisplayedCards: Note[] = [];
      for (let i = 0; i < newCards.length; i++) {
        let card = await DatabaseService.getRecord(newCards[i].key, "notes");
        if (card) {
          newDisplayedCards.push(card);
        }
      }

      setState((prev) => ({
        ...prev,
        displayedCards: [...prev.displayedCards, ...newDisplayedCards],
        currentPage: nextPage,
        isLoading: false,
      }));
    }, 200);
  };

  const handleScroll = () => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    scrollTimerRef.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;

      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMoreCards();
      }
    }, 100);
  };

  useEffect(() => {
    loadInitialCards();
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const isFirstRef = useRef(true);
  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    loadInitialCards();
  }, [props.cards, noteSortCode]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp));
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  const handleJump = async (note: NoteModel) => {
    note = await DatabaseService.getRecord(note.key, "notes");
    let book: BookModel | null = null;
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === note.bookKey) {
        book = await DatabaseService.getRecord(books[i].key, "books");
        break;
      }
    }
    if (!book) {
      toast(t("Book not exists"));
      return;
    }

    let bookLocation: any = {};
    try {
      bookLocation = JSON.parse(note.cfi) || {};
    } catch (error) {
      bookLocation.cfi = note.cfi;
      bookLocation.chapterTitle = note.chapter;
    }
    if (bookLocation.fingerprint) {
      bookLocation.chapterDocIndex = bookLocation.page - 1 + "";
      bookLocation.chapterHref = "title" + (bookLocation.page - 1);
    }
    ConfigService.setObjectConfig(note.bookKey, bookLocation, "recordLocation");

    BookUtil.redirectBook(book);
  };

  let { cards } = props;
  const { displayedCards, isLoading } = state;

  if (cards.length === 0) {
    return <Navigate to="/manager/empty" replace />;
  }

  const renderCardListItem = (notes: any[]) => {
    return notes.map((item: NoteModel, index: number) => {
      return (
        <li
          className="card-list-item"
          key={index}
          style={
            props.mode === "note" && !isCollapsed
              ? { height: "250px" }
              : props.mode === "note" && isCollapsed
                ? { height: "250px", width: "calc(50vw - 70px)" }
                : isCollapsed
                  ? { width: "calc(50vw - 70px)" }
                  : {}
          }
        >
          <div className="card-list-item-card">
            <div
              className="card-list-item-title"
              style={{ padding: 15, opacity: 0.6 }}
            >
              {formatTimestamp(item.key)}
            </div>
            <div className="card-list-item-text-parent">
              <div className="card-list-item-note">
                {props.mode === "note" ? item.notes : item.text}
              </div>
            </div>
            {props.mode === "note" ? (
              <div className="card-list-item-text-note">
                <div className="card-list-item-text">{item.text}</div>
              </div>
            ) : null}

            <div className="card-list-item-citation">
              <div className="card-list-item-title">
                <Trans>From</Trans>《
              </div>
              <div className="card-list-item-chapter card-list-item-title">
                {props.bookNamesMap[item.bookKey]}
              </div>
              <div className="card-list-item-chapter card-list-item-title">
                》{item.chapter}
              </div>
            </div>
            <div className="card-list-item-show-more-container">
              <span
                data-tooltip-id="my-tooltip"
                data-tooltip-content={t("Edit")}
              >
                <span
                  className="icon-edit-line"
                  style={{
                    fontSize: "22px",
                    marginRight: "15px",
                    marginLeft: "15px",
                  }}
                  onClick={() => {
                    handleNoteKey(item.key);
                    handleShowPopupNote(true);
                  }}
                ></span>
              </span>

              <span
                data-tooltip-id="my-tooltip"
                data-tooltip-content={t("Show in the book")}
              >
                <span
                  className="icon-idea-line"
                  style={{
                    fontSize: "22px",

                    fontWeight: 400,
                  }}
                  onClick={() => {
                    handleJump(item);
                  }}
                ></span>
              </span>

              <span
                data-tooltip-id="my-tooltip"
                data-tooltip-content={t("Copy note link")}
              >
                <span
                  className="icon-copy-line"
                  style={{
                    fontSize: "18px",
                    marginLeft: "15px",
                    position: "relative",
                    top: "2px",
                  }}
                  onClick={() => {
                    const link = `koodo-reader://open-note?noteKey=${item.key}`;
                    navigator.clipboard.writeText(link).then(() => {
                      toast(t("Copied"));
                    });
                  }}
                ></span>
              </span>
            </div>
          </div>
        </li>
      );
    });
  };

  return (
    <div className="card-list-container" ref={containerRef}>
      {renderCardListItem(displayedCards)}
      {isLoading && (
        <div className="card-list-loading">
          <div className="loading-spinner">{t("Loading")}...</div>
        </div>
      )}
    </div>
  );
};

export default CardList;
