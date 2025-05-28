import BookModel from "../../../models/Book";

export interface PopupReferProps {
  currentBook: BookModel;
  isChangeDirection: boolean;
  menuMode: string;
  color: number;
  rendition: any;
  chapterDocIndex: number;
  readerMode: string;
  t: (title: string) => string;
}
export interface PopupReferStates {
  rect: any;
  isOpenMenu: boolean;
  footnote: string;
}
