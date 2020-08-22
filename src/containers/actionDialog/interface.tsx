import BookModel from "../../model/Book";

export interface ActionDialogProps {
  book: BookModel;
  currentBook: BookModel;
  currentEpub: any;
  handleFetchBooks: () => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleReadingBook: (book: BookModel) => void;
  handleReadingState: (isReading: boolean) => void;
  handleReadingEpub: (epub: object) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
}
