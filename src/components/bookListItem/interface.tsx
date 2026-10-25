import BookModel from "../../models/Book";

export interface BookItemProps {
  book: BookModel;
  isSelected?: boolean;
  allBooks?: BookModel[];
  bookIndex?: number;

}
export interface BookItemState {
  isHover: boolean;

  isDeleteDialog: boolean;
  isFavorite: boolean;
  direction: string;
  left: number;
  top: number;
  cover: string;
  isCoverExist: boolean;
  isBookOffline: boolean;
}
