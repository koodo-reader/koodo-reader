import BookModel from "../../model/Book";

export interface BookProps {
  book: BookModel;
  bookCover: string;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleReadingEpub: (epub: object) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
}
export interface BookState {
  isDeleteDialog: boolean;
  isOpenConfig: boolean;
  isFavorite: boolean;
}
