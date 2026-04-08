import { useState, useEffect, useCallback, useRef } from "react";
import BookModel from "../../models/Book";
import BookUtil from "../../utils/file/bookUtil";
import CoverUtil from "../../utils/file/coverUtil";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

export interface BookItemSharedProps {
  book: BookModel;
  refreshBookKey: string;
  isSelectBook: boolean;
  isSelected: boolean;
  selectedBooks: string[];
  allBooks?: BookModel[];
  bookIndex?: number;
  handleRefreshBookCover: (key: string) => void;
  handleReadingBook: (book: BookModel) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
}

export function useBookItem(props: BookItemSharedProps) {
  const {
    book,
    refreshBookKey,
    isSelectBook,
    isSelected,
    selectedBooks,
    allBooks,
    bookIndex,
    handleRefreshBookCover,
    handleReadingBook,
    handleSelectBook,
    handleSelectedBooks,
  } = props;

  const [isFavorite, setIsFavorite] = useState(
    ConfigService.getAllListConfig("favoriteBooks").indexOf(book.key) > -1
  );
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [direction, setDirection] = useState("horizontal");
  const [isHover, setIsHover] = useState(false);
  const [cover, setCover] = useState("");
  const [isCoverExist, setIsCoverExist] = useState(false);
  const [isBookOffline, setIsBookOffline] = useState(true);

  // Track previous values for comparison
  const prevBookKeyRef = useRef(book.key);
  const prevRefreshBookKeyRef = useRef(refreshBookKey);

  useEffect(() => {
    let cancelled = false;
    async function loadCoverAndOffline() {
      const [newCover, newIsCoverExist, newIsBookOffline] = await Promise.all([
        CoverUtil.getCover(book),
        CoverUtil.isCoverExist(book),
        BookUtil.isBookOffline(book.key),
      ]);
      if (!cancelled) {
        setCover(newCover);
        setIsCoverExist(newIsCoverExist);
        setIsBookOffline(newIsBookOffline);
      }
    }
    loadCoverAndOffline();
    return () => {
      cancelled = true;
    };
  }, [book]);

  // Replicate UNSAFE_componentWillReceiveProps logic
  useEffect(() => {
    const bookKeyChanged = book.key !== prevBookKeyRef.current;
    const refreshTriggered =
      refreshBookKey === book.key &&
      refreshBookKey !== prevRefreshBookKeyRef.current;

    prevBookKeyRef.current = book.key;
    prevRefreshBookKeyRef.current = refreshBookKey;

    if (!bookKeyChanged && !refreshTriggered) return;

    let cancelled = false;
    async function refreshCover() {
      let newCover = await CoverUtil.getCover(book);
      const newIsCoverExist = await CoverUtil.isCoverExist(book);
      if (
        newCover &&
        !newCover.startsWith("data:") &&
        !newCover.startsWith("blob:") &&
        !newCover.startsWith("http")
      ) {
        newCover = newCover + "?t=" + Date.now();
      }
      const newIsBookOffline = await BookUtil.isBookOffline(book.key);
      if (!cancelled) {
        setIsFavorite(
          ConfigService.getAllListConfig("favoriteBooks").indexOf(book.key) > -1
        );
        setCover(newCover);
        setIsCoverExist(newIsCoverExist);
        setIsBookOffline(newIsBookOffline);
        handleRefreshBookCover("");
      }
    }
    refreshCover();
    return () => {
      cancelled = true;
    };
  }, [book.key, refreshBookKey]); // intentionally omitting other deps to replicate componentWillReceiveProps behaviour

  const handleShiftSelect = useCallback(() => {
    if (!allBooks || bookIndex === undefined) return;
    let firstSelectedIndex = -1;
    let lastSelectedIndex = -1;
    for (let i = 0; i < allBooks.length; i++) {
      if (selectedBooks.indexOf(allBooks[i].key) > -1) {
        if (firstSelectedIndex === -1) firstSelectedIndex = i;
        lastSelectedIndex = i;
      }
    }
    if (firstSelectedIndex === -1) {
      if (!isSelectBook) {
        handleSelectBook(true);
      }
      handleSelectedBooks([book.key]);
      return;
    }
    if (bookIndex >= firstSelectedIndex && bookIndex <= lastSelectedIndex) {
      const rangeKeys = allBooks
        .slice(firstSelectedIndex, bookIndex + 1)
        .map((b) => b.key);
      handleSelectedBooks(rangeKeys);
    } else {
      const anchorIndex =
        bookIndex < firstSelectedIndex ? firstSelectedIndex : lastSelectedIndex;
      const start = Math.min(anchorIndex, bookIndex);
      const end = Math.max(anchorIndex, bookIndex);
      const rangeKeys = allBooks.slice(start, end + 1).map((b) => b.key);
      const merged = Array.from(new Set([...selectedBooks, ...rangeKeys]));
      handleSelectedBooks(merged);
    }
  }, [
    allBooks,
    bookIndex,
    selectedBooks,
    isSelectBook,
    book.key,
    handleSelectBook,
    handleSelectedBooks,
  ]);

  const handleJump = useCallback(
    (event?: React.MouseEvent) => {
      if (isSelectBook) {
        if (event?.shiftKey) {
          handleShiftSelect();
        } else {
          handleSelectedBooks(
            isSelected
              ? selectedBooks.filter((item) => item !== book.key)
              : [...selectedBooks, book.key]
          );
        }
        return;
      }
      handleReadingBook(book);
      BookUtil.redirectBook(book);
    },
    [
      isSelectBook,
      isSelected,
      selectedBooks,
      book,
      handleShiftSelect,
      handleReadingBook,
      handleSelectedBooks,
    ]
  );

  const handleSelectIconClick = useCallback(
    (event: React.MouseEvent) => {
      if (isSelectBook) {
        if (event.shiftKey) {
          handleShiftSelect();
        } else {
          handleSelectedBooks(
            isSelected
              ? selectedBooks.filter((item) => item !== book.key)
              : [...selectedBooks, book.key]
          );
        }
      } else {
        handleSelectBook(true);
        handleSelectedBooks([book.key]);
      }
      setIsHover(false);
      event?.stopPropagation();
    },
    [
      isSelectBook,
      isSelected,
      selectedBooks,
      book.key,
      handleShiftSelect,
      handleSelectBook,
      handleSelectedBooks,
    ]
  );

  const getPercentage = useCallback((): string => {
    const record = ConfigService.getObjectConfig(
      book.key,
      "recordLocation",
      {}
    );
    if (record && record.percentage) {
      return record.percentage;
    }
    return "0";
  }, [book.key]);

  const isFavoriteBook = useCallback((): boolean => {
    return (
      ConfigService.getAllListConfig("favoriteBooks").indexOf(book.key) > -1
    );
  }, [book.key]);

  return {
    // state
    isFavorite,
    setIsFavorite,
    left,
    setLeft,
    top,
    setTop,
    direction,
    setDirection,
    isHover,
    setIsHover,
    cover,
    isCoverExist,
    isBookOffline,
    // handlers
    handleShiftSelect,
    handleJump,
    handleSelectIconClick,
    getPercentage,
    isFavoriteBook,
  };
}
