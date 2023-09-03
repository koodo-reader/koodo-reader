import BookModel from "../../../model/Book";
export interface DetailDialogProps {
  handleDetailDialog: (isDetailDialog: boolean) => void;
  tip: string;
  currentBook: BookModel;
}
export interface DetailDialogState {
  backgroundColor: string;
  textColor: string;
}
