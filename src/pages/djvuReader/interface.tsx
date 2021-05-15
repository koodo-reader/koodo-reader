import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface DjvuReaderProps {
  book: BookModel;
  currentBook: BookModel;
  isOpenActionDialog: boolean;
  isReading: boolean;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleReadingEpub: (epub: object) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface DjvuReaderState {}
