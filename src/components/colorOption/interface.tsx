import BookModel from "../../models/Book";
export interface ColorProps {
  color: number;
  isEdit: boolean;
  currentBook: BookModel;
  handleColor: (color: number) => void;
  handleDigest: () => void;
}
export interface ColorStates {
  isLine: boolean;
}
