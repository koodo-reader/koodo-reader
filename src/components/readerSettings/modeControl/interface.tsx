import Book from "../../../models/Book";

export type ReaderViewMode = "single" | "double" | "scroll";

export interface ModeControlProps {
  renderBookFunc: () => void;
  t: (title: string) => string;
  readerMode: ReaderViewMode;
  currentBook: Book;
  handleReaderMode: (readerMode: ReaderViewMode) => void;
}

export interface ModeControlState {}
