import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface BookProps extends RouteComponentProps<any> {
  book: BookModel;
  currentBook: BookModel;
  isOpenActionDialog: boolean;
  handleReadingBook: (book: BookModel) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface BookState {
  isOpenConfig: boolean;
  isFavorite: boolean;
  left: number;
  top: number;
}
