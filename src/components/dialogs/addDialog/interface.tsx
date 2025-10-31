import BookModel from "../../../models/Book";

export interface AddDialogProps {
  handleAddDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  currentBook: BookModel;
  selectedBooks: string[];
  isSelectBook: boolean;
  mode: string;
  shelfTitle: string;
  t: (title: string) => string;
  handleMode: (mode: string) => void;
  handleShelf: (shelfTitle: string) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
}
export interface AddDialogState {
  isNew: boolean;
  shelfTitle: string;
  actionType: string;
}
