import BookModel from "../../model/Book";

export interface ViewerProps {
  book: BookModel;
  currentBook: BookModel;
  isReading: boolean;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  t: (title: string) => string;
}
export interface ViewerState {
  href: string;
  title: string;
}
