import BookModel from "../../models/Book";
export interface BackgroundProps {
  currentBook: BookModel;
  readerMode: string;
}
export interface BackgroundState {
  isSingle: boolean;
  scale: string;
}
