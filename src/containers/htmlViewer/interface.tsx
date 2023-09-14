import Book from "../../model/Book";
import HtmlBook from "../../model/HtmlBook";
import Note from "../../model/Note";

export interface ViewerProps {
  book: Book;
  rendition: any;
  currentBook: Book;
  books: Book[];
  menuMode: string;
  notes: Note[];
  isReading: boolean;
  htmlBook: HtmlBook;
  isShow: boolean;
  handleRenderBookFunc: (renderBookFunc: () => void) => void;
  renderNoteFunc: () => void;
  t: (title: string) => string;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: Book) => void;
  handleHtmlBook: (htmlBook: HtmlBook | null) => void;
  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleCurrentChapter: (currentChapter: string) => void;
  handleCurrentChapterIndex: (currentChapterIndex: number) => void;
  handlePercentage: (percentage: number) => void;
  handleFetchPercentage: (book: Book) => void;
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
