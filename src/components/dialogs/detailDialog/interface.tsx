import BookModel from "../../../models/Book";
export interface DetailDialogProps {
  handleDetailDialog: (isDetailDialog: boolean) => void;
  currentBook: BookModel;
}
export interface DetailDialogState {
  backgroundColor: string;
  textColor: string;
}
