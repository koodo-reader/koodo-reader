import BookModel from "../../models/Book";
export interface BackgroundProps {
  currentBook: BookModel;
}
export interface BackgroundState {
  isSingle: boolean;
  scale: string;
}
