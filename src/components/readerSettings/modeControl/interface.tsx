import Book from "../../../models/Book";

export interface ModeControlProps {
  renderBookFunc: () => void;
  t: (title: string) => string;
  readerMode: string;
  currentBook: Book;
  handleReaderMode: (readerMode: string) => void;
}

export interface ModeControlState {}
