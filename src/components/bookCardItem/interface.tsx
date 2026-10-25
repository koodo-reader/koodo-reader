import BookModel from "../../models/Book";

export interface BookCardProps {
  book: BookModel;
  isSelected?: boolean;
  cardScale?: number;
  allBooks?: BookModel[];
  bookIndex?: number;
}
export interface BookCardState {
  isFavorite: boolean;
  isHover: boolean;
  left: number;
  top: number;
  direction: string;
  cover: string;
  isCoverExist: boolean;
  isBookOffline: boolean;
}
