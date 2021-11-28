import BookModel from "../../model/Book";
import HtmlBookModel from "../../model/HtmlBook";

export interface ViewerProps {
  book: BookModel;
  rendition: any;
  currentBook: BookModel;
  books: BookModel[];
  isReading: boolean;
  htmlBook: HtmlBookModel;
  isShow: boolean;
  handleRenderFunc: (renderFunc: () => void) => void;
  t: (title: string) => string;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleHtmlBook: (htmlBook: HtmlBookModel) => void;
  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
}
export interface ViewerState {
  key: string;
  scale: string;
  isFirst: boolean;
  chapterTitle: string;
  margin: number;
  readerMode: string;
  chapter: string;
  chapterIndex: number;
  pageWidth: number;
  pageHeight: number;
  cfiRange: any;
  contents: any;
  rect: any;
}
