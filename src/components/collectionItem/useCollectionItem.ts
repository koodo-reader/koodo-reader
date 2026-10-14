import { useState, useCallback, useMemo } from "react";
import CollectionModel from "../../models/Collection";
import BookModel from "../../models/Book";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import CollectionUtil from "../../utils/file/collectionUtil";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import {
  setBookDragData,
  parseBookDragData,
  isBookDragEvent,
  filterNonCollectionKeys,
  getMovedFromSuffix,
} from "../../utils/reader/bookDrag";

export interface CollectionItemSharedProps {
  collection: CollectionModel;
  refreshBookKey: string;
  isSelectBook: boolean;
  isSelected: boolean;
  selectedBooks: string[];
  allBooks?: { key: string }[];
  bookIndex?: number;
  handleReadingBook: (book: BookModel) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleFetchBooks?: () => void;
  handleCollectionDialog: (isOpen: boolean) => void;
  handleCollectionDialogMode: (mode: string) => void;
  handleCollectionDialogBooks: (books: string[]) => void;
  handleCollectionDialogKey: (key: string) => void;
  handleCollectionDetailDialog: (isOpen: boolean) => void;
  handleCurrentCollectionKey: (key: string) => void;
}

export function useCollectionItem(props: CollectionItemSharedProps) {
  const {
    collection,
    isSelectBook,
    isSelected,
    selectedBooks,
    allBooks,
    bookIndex,
    handleReadingBook,
    handleSelectBook,
    handleSelectedBooks,
    handleFetchBooks,
    handleCollectionDialog,
    handleCollectionDialogMode,
    handleCollectionDialogBooks,
    handleCollectionDialogKey,
    handleCollectionDetailDialog,
    handleCurrentCollectionKey,
  } = props;

  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const collectionBook = useMemo(
    () => CollectionUtil.getCollectionAsBook(collection),
    [collection.key, collection.name]
  );

  const percentage = CollectionUtil.getCollectionPercentage(collection);

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
      handleSelectedBooks([collection.key]);
      return;
    }
    if (bookIndex >= firstSelectedIndex && bookIndex <= lastSelectedIndex) {
      let rangeKeys = allBooks
        .slice(firstSelectedIndex, bookIndex + 1)
        .map((book) => book.key);
      handleSelectedBooks(rangeKeys);
    } else {
      let anchorIndex =
        bookIndex < firstSelectedIndex ? firstSelectedIndex : lastSelectedIndex;
      let start = Math.min(anchorIndex, bookIndex);
      let end = Math.max(anchorIndex, bookIndex);
      let rangeKeys = allBooks.slice(start, end + 1).map((book) => book.key);
      let merged = Array.from(new Set([...selectedBooks, ...rangeKeys]));
      handleSelectedBooks(merged);
    }
  }, [
    allBooks,
    bookIndex,
    selectedBooks,
    isSelectBook,
    collection.key,
    handleSelectBook,
    handleSelectedBooks,
  ]);

  const handleOpenDetail = useCallback(() => {
    if (!CollectionUtil.isCollectionDeleted(collection.key)) {
      ConfigService.setListConfig(collection.key, "recentBooks");
    }
    handleReadingBook(collectionBook);
    handleCurrentCollectionKey(collection.key);
    handleCollectionDetailDialog(true);
  }, [
    collection.key,
    collectionBook,
    handleReadingBook,
    handleCurrentCollectionKey,
    handleCollectionDetailDialog,
  ]);

  const handleJump = useCallback(
    (event?: React.MouseEvent) => {
      if (isSelectBook) {
        if (event?.shiftKey) {
          handleShiftSelect();
        } else {
          handleSelectedBooks(
            isSelected
              ? selectedBooks.filter((item) => item !== collection.key)
              : [...selectedBooks, collection.key]
          );
        }
        return;
      }
      handleOpenDetail();
    },
    [
      isSelectBook,
      isSelected,
      selectedBooks,
      collection.key,
      handleShiftSelect,
      handleOpenDetail,
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
              ? selectedBooks.filter((item) => item !== collection.key)
              : [...selectedBooks, collection.key]
          );
        }
      } else {
        handleSelectBook(true);
        handleSelectedBooks([collection.key]);
      }
      setIsHover(false);
      event?.stopPropagation();
    },
    [
      isSelectBook,
      isSelected,
      selectedBooks,
      collection.key,
      handleShiftSelect,
      handleSelectBook,
      handleSelectedBooks,
    ]
  );

  const isFavoriteBook = useCallback((): boolean => {
    return CollectionUtil.isCollectionFavorite(collection);
  }, [collection]);

  const isTopBook = useCallback((): boolean => {
    return (
      ConfigService.getAllListConfig("topBooks").indexOf(collection.key) > -1
    );
  }, [collection.key]);

  const handleBookDragStart = useCallback(
    (e: React.DragEvent) => {
      const keys =
        isSelectBook &&
        selectedBooks.length > 0 &&
        selectedBooks.includes(collection.key)
          ? selectedBooks
          : [collection.key];
      setBookDragData(e, keys);
    },
    [collection.key, isSelectBook, selectedBooks]
  );

  const handleCollectionDropDragOver = useCallback((e: React.DragEvent) => {
    if (!isBookDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleCollectionDropDragEnter = useCallback((e: React.DragEvent) => {
    if (!isBookDragEvent(e)) return;
    e.preventDefault();
    setIsDropTarget(true);
  }, []);

  const handleCollectionDropDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDropTarget(false);
  }, []);

  const handleCollectionBookDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isBookDragEvent(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDropTarget(false);
      if (CollectionUtil.isDeletedKey(collection.key)) return;
      let bookKeys = filterNonCollectionKeys(parseBookDragData(e)).filter(
        (key) => key !== collection.key && !CollectionUtil.isDeletedKey(key)
      );
      if (bookKeys.length === 0) return;
      const { added, movedFrom } = CollectionUtil.addBooksToCollection(
        collection.key,
        bookKeys
      );
      if (added > 0 || movedFrom.length > 0) {
        toast.success(
          i18n.t("Added to collection") + getMovedFromSuffix(movedFrom)
        );
        if (handleFetchBooks) handleFetchBooks();
      }
    },
    [collection.key, handleFetchBooks]
  );

  return {
    left,
    setLeft,
    top,
    setTop,
    isHover,
    setIsHover,
    isDropTarget,
    collectionBook,
    percentage,
    handleShiftSelect,
    handleJump,
    handleSelectIconClick,
    isFavoriteBook,
    isTopBook,
    handleBookDragStart,
    handleCollectionDropDragOver,
    handleCollectionDropDragEnter,
    handleCollectionDropDragLeave,
    handleCollectionBookDrop,
  };
}
