import BookModel from "../../../models/Book";

export interface AddCollectionDialogProps {
  currentBook: BookModel;
  isSelectBook: boolean;
  selectedBooks: string[];
  handleAddCollectionDialog: (isOpen: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleFetchBooks: () => void;
  t: (title: string) => string;
}

export interface AddCollectionDialogState {
  isNew: boolean;
  collectionKey: string;
}
