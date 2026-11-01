import BookModel from "../../../models/Book";

export interface CollectionDetailDialogProps {
  currentCollectionKey: string;
  refreshBookKey: string;
  handleCollectionDetailDialog: (isOpen: boolean) => void;
  handleFetchBooks: () => void;
  t: (title: string) => string;
}

export interface CollectionDetailDialogState {
  books: BookModel[];
}
