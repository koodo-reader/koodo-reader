import BookModel from "../../../model/Book";

export interface AddDialogProps {
  handleAddDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  currentBook: BookModel;
  selectedBooks: string[];
  isSelectBook: boolean;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMode: (mode: string) => void;
  handleShelfIndex: (shelfIndex: number) => void;
  t: (title: string) => string;
  handleSelectedBooks: (selectedBooks: string[]) => void;
}
export interface AddDialogState {
  isNew: boolean;
  shelfTitle: string;
}
