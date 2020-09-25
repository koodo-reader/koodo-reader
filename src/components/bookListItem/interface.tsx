import BookModel from "../../model/Book";

export interface BookItemProps {
  book: BookModel;
  percentage: number;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleReadingEpub: (epub: object) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
}
export interface BookItemState {
  isDeleteDialog: boolean;
}
