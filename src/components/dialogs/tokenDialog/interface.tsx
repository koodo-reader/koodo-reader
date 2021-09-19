import BookModel from "../../../model/Book";
export interface TokenDialogProps {
  handleTokenDialog: (isShow: boolean) => void;
  currentBook: BookModel;
  driveName: string;
  url: string;
  t: (title: string) => string;
}
export interface TokenDialogState {
  isNew: boolean;
}
