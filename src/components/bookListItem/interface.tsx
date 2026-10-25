import BookModel from "../../models/Book";

export interface BookItemProps {
  book: BookModel;
  isSelected?: boolean;
  allBooks?: BookModel[];
  bookIndex?: number;

}
