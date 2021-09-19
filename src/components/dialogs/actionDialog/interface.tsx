import BookModel from "../../../model/Book";

export interface ActionDialogProps {
  book: BookModel;
  currentBook: BookModel;
  currentEpub: any;
  left: number;
  top: number;
  mode: string;
  handleFetchBooks: () => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
  handleReadingBook: (book: BookModel) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
}
