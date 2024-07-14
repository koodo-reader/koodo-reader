import BookModel from "../../../models/Book";
export interface UpdateInfoProps {
  currentBook: BookModel;
  books: BookModel[];
  isShowNew: boolean;
  t: (title: string) => string;
  handleNewDialog: (isShowNew: boolean) => void;
  handleNewWarning: (isNewWarning: boolean) => void;
}
export interface UpdateInfoState {
  updateLog: any;
  isUpdated: boolean;
}
