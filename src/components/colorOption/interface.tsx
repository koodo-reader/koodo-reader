import BookModel from "../../model/Book";
export interface ColorProps {
  color: number;
  currentBook: BookModel;
  handleColor: (color: number) => void;
}
export interface ColorStates {
  isLine: boolean;
}
