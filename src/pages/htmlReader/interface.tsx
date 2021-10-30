import BookModel from "../../model/Book";
import HtmlBookModel from "../../model/HtmlBook";
export interface ReaderProps {
  currentEpub: any;
  currentBook: BookModel;
  percentage: number;
  t: (title: string) => string;
  htmlBook: HtmlBookModel;
  handleFetchNotes: () => void;
  handleFetchBooks: () => void;
  handleFetchBookmarks: () => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleFetchChapters: (currentEpub: any) => void;
  handleReadingBook: (book: BookModel) => void;
}

export interface ReaderState {
  isOpenRightPanel: boolean;
  isOpenTopPanel: boolean;
  isOpenBottomPanel: boolean;
  isOpenLeftPanel: boolean;
  isTouch: boolean;
  isPreventTrigger: boolean;
  readerMode: string;
  hoverPanel: string;
  rendition: any;
  time: number;
  scale: string;
  margin: number;
}
