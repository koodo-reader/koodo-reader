import BookModel from "../../models/Book";
export interface BackgroundProps {
  currentBook: BookModel;
  readerMode: string;
  scale: string;
  margin: string;
  isNavLocked: boolean;
  isSettingLocked: boolean;
}
export interface BackgroundState {
  isSingle: boolean;
  pageOffset: string;
  pageWidth: string;
}
