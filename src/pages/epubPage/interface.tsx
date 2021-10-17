import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface EpubReaderProps extends RouteComponentProps<any> {
  book: BookModel;
  currentBook: BookModel;
  currentEpub: any;
  isOpenActionDialog: boolean;
  isReading: boolean;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleReadingEpub: (epub: object) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
  t: (title: string) => string;
}
export interface EpubReaderState {}
