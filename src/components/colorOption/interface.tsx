import BookModel from "../../model/Book";
export interface ColorProps {
  color: number;
  currentEpub: any;
  currentBook: BookModel;
  handleColor: (color: number) => void;
}
export interface ColorStates {
  isLine: boolean;
}
