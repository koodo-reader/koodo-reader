import BookModel from "../../models/Book";
import HtmlBookModel from "../../models/HtmlBook";
export interface ReaderProps {
  currentBook: BookModel;
  percentage: number;
  t: (title: string) => string;
  htmlBook: HtmlBookModel;
  isNavLocked: boolean;
  isSettingLocked: boolean;
  isConvertOpen: boolean;
  isSearch: boolean;
  isAuthed: boolean;
  readerMode: string;
  handleFetchNotes: () => void;
  handleReaderMode: (readerMode: string) => void;
  handleConvertDialog: (isConvertOpen: boolean) => void;
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
  totalDuration: number;
  currentDuration: number;
}
