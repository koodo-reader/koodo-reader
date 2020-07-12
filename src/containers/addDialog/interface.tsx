import BookModel from "../../model/Book";
export interface AddDialogProps {
  handleAddDialog: (isShow: boolean) => void;
  currentBook: BookModel;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface AddDialogState {
  isNew: boolean;
  shelfTitle: string;
}
