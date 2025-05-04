import BookModel from "../../models/Book";
export interface BackgroundProps {
  currentBook: BookModel;
  readerMode: string;
  isNavLocked: boolean;
  isSettingLocked: boolean;
}
export interface BackgroundState {
  isSingle: boolean;
  scale: string;
  margin: number;
  pageOffset: string;
  pageWidth: string;
}
