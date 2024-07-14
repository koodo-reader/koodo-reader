import BookModel from "../../../models/Book";
export interface TokenDialogProps {
  handleTokenDialog: (isShow: boolean) => void;
  currentBook: BookModel;
  driveName: string;
  title: string;
  url: string;
  t: (title: string) => string;
}
export interface TokenDialogState {
  isNew: boolean;
}
