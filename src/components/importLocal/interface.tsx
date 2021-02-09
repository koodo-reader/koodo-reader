import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";
export interface ImportLocalProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  dragItem: string;

  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleFetchBooks: () => void;
  handleDrag: (isDrag: boolean) => void;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleDownloadDesk: (isDownloadDesk: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
}
export interface ImportLocalState {
  isOpenFile: boolean;
}
