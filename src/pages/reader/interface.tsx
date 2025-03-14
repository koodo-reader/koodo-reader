import BookModel from "../../models/Book";
import HtmlBookModel from "../../models/HtmlBook";
export interface ReaderProps {
  currentBook: BookModel;
  percentage: number;
  t: (title: string) => string;
  htmlBook: HtmlBookModel;
  isNavLocked: boolean;
  isSearch: boolean;
  readerMode: string;
  handleFetchNotes: () => void;
  handleReaderMode: (readerMode: string) => void;
  handleMenuMode: (menuMode: string) => void;
  handleOriginalText: (originalText: string) => void;
  handleFetchBooks: () => void;
  handleOpenMenu: (isOpen: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleReadingBook: (book: BookModel) => void;
}

export interface ReaderState {
  isOpenRightPanel: boolean;
  isOpenTopPanel: boolean;
  isOpenBottomPanel: boolean;
  isOpenLeftPanel: boolean;
  isTouch: boolean;
  isPreventTrigger: boolean;
  hoverPanel: string;
  scale: string;
  isShowScale: boolean;
  time: number;
}
