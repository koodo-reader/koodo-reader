import BookModel from "../../model/Book";

export interface ViewerProps {
  book: BookModel;
  currentBook: BookModel;
  isReading: boolean;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface ViewerState {
  key: string;
}
