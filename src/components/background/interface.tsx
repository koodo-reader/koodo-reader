import BookModel from "../../model/Book";
export interface BackgroundProps {
  currentBook: BookModel;
}
export interface BackgroundState {
  isSingle: boolean;
  scale: string;
}
