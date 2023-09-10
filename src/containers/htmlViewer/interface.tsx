import BookModel from "../../model/Book";
import HtmlBookModel from "../../model/HtmlBook";

export interface ViewerProps {
  book: BookModel;
  rendition: any;
  currentBook: BookModel;
  books: BookModel[];
  menuMode: string;

  isReading: boolean;
  htmlBook: HtmlBookModel;
  isShow: boolean;
  handleRenderBookFunc: (renderBookFunc: () => void) => void;
  renderNoteFunc: () => void;
  t: (title: string) => string;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleHtmlBook: (htmlBook: HtmlBookModel | null) => void;
  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleCurrentChapter: (currentChapter: string) => void;
  handleCurrentChapterIndex: (currentChapterIndex: number) => void;
  handlePercentage: (percentage: number) => void;
  handleFetchPercentage: (book: BookModel) => void;
}
export interface ViewerState {
  key: string;
  scale: string;
  isFirst: boolean;
  chapterTitle: string;
  isDisablePopup: boolean;
  margin: number;
  readerMode: string;
  chapter: string;
  chapterDocIndex: number;
  cfiRange: any;
  contents: any;
  rect: any;
  rendition: any;
}
