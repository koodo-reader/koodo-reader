import BookModel from "../../../models/Book";

export interface CollectionDetailDialogProps {
  currentCollectionKey: string;
  refreshBookKey: string;
  isOpenActionDialog: boolean;
  currentBook: BookModel;
  handleCollectionDetailDialog: (isOpen: boolean) => void;
  handleFetchBooks: () => void;
  handleReadingBook: (book: BookModel) => void;
  handleActionDialog: (isOpen: boolean) => void;
  t: (title: string) => string;
}

export interface LoadedBookItem {
  book: BookModel;
  cover: string;
  isCoverExist: boolean;
  percentage: string;
}

export interface CollectionDetailDialogState {
  books: LoadedBookItem[];
  left: number;
  top: number;
}
