import BookModel from "../../../model/Book";
export interface UpdateInfoProps {
  currentBook: BookModel;
  books: BookModel[];
  isShowNew: boolean;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleNewDialog: (isShowNew: boolean) => void;
}
export interface UpdateInfoState {
  updateLog: any;
  isUpdated: boolean;
}
