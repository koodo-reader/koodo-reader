import BookModel from "../../models/Book";

export interface BookCardProps {
  book: BookModel;
  isSelected?: boolean;
  cardScale?: number;
  allBooks?: BookModel[];
  bookIndex?: number;
}
