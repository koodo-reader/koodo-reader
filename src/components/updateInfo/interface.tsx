import BookModel from "../../model/Book";
export interface UpdateInfoProps {
  currentBook: BookModel;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface UpdateInfoState {
  downlownLink: string;
}
