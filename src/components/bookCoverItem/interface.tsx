import BookModel from "../../models/Book";

export interface BookCoverProps {
  book: BookModel;
  isSelected?: boolean;
  allBooks?: BookModel[];
  bookIndex?: number;
}
export interface BookCoverState {
  isHover: boolean;

  isFavorite: boolean;
  left: number;
  top: number;
  direction: string;
  desc: string;
  cover: string;
  isCoverExist: boolean;
  isBookOffline: boolean;
}
