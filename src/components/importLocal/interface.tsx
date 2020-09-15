import BookModel from "../../model/Book";

export interface ImportLocalProps {
  books: BookModel[];
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleFetchBooks: () => void;
}
export interface ImportLocalState {
  isRepeat: boolean;
}
