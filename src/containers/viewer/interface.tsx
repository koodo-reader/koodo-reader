import Book from "../../models/Book";
import HtmlBook from "../../models/HtmlBook";
import Note from "../../models/Note";

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
  readerMode: string;
  isOpenMenu: boolean;
  isNavLocked: boolean;
  isSettingLocked: boolean;
  defaultSyncOption: string;
  handleRenderBookFunc: (renderBookFunc: () => void) => void;
  renderNoteFunc: () => void;
  handleFetchAuthed: () => void;
  t: (title: string) => string;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: Book) => void;
  handleHtmlBook: (htmlBook: HtmlBook | null) => void;
  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchPlugins: () => void;
  handleFetchBookmarks: () => void;
  handleNoteKey: (key: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleReaderMode: (readerMode: string) => void;
  handleCurrentChapter: (currentChapter: string) => void;
  handleCurrentChapterIndex: (currentChapterIndex: number) => void;
  handlePercentage: (percentage: number) => void;
  handleFetchPercentage: (book: Book) => void;
}
export interface ViewerState {
  key: string;
  scale: string;
  isFirst: boolean;
  isTouch: boolean;
  chapterTitle: string;
  isDisablePopup: boolean;
  margin: number;
  chapter: string;
  pageOffset: string;
  pageWidth: string;
  chapterDocIndex: number;
  cfiRange: any;
  contents: any;
  rect: any;
  rendition: any;
}
