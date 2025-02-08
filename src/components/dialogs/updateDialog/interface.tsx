import BookModel from "../../../models/Book";
export interface UpdateInfoProps {
  currentBook: BookModel;
  books: BookModel[];
  isShowNew: boolean;
  isAuthed: boolean;
  t: (title: string) => string;
  handleNewDialog: (isShowNew: boolean) => void;
  handleNewWarning: (isNewWarning: boolean) => void;
  handleFetchAuthed: () => void;
  handleLoginOptionList: (loginOptionList: string[]) => void;
}
export interface UpdateInfoState {
  updateLog: any;
}
