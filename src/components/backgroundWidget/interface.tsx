import BookModel from "../../model/Book";
export interface BackgroundProps {
  currentEpub: any;
  currentBook: BookModel;
}
export interface BackgroundState {
  isSingle: boolean;
  scale: string;
}
