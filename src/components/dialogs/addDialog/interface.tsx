import BookModel from "../../../model/Book";

export interface AddDialogProps {
  handleAddDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  currentBook: BookModel;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMode: (mode: string) => void;
  handleShelfIndex: (shelfIndex: number) => void;
  t: (title: string) => string;
}
export interface AddDialogState {
  isNew: boolean;
  shelfTitle: string;
}
