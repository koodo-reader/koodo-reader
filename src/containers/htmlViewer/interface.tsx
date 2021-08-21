import BookModel from "../../model/Book";
import HtmlBookModel from "../../model/HtmlBook";

export interface ViewerProps {
  book: BookModel;
  currentBook: BookModel;
  isReading: boolean;
  htmlBook: HtmlBookModel;
  handleRenderFunc: (renderFunc: () => void) => void;

  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleHtmlBook: (htmlBook: HtmlBookModel) => void;
  handleLeaveReader: (position: string) => void;
}
export interface ViewerState {
  key: string;
  scale: string;
  isLoading: boolean;
}
