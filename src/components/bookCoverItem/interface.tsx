import BookModel from "../../models/Book";

export interface BookCoverProps {
  book: BookModel;
  isSelected?: boolean;
  allBooks?: BookModel[];
  bookIndex?: number;
}
