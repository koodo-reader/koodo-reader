import BookModel from "../../../models/Book";
import { HighlightValue } from "../../../utils/common";

export interface PopupReferProps {
  currentBook: BookModel;
  isChangeDirection: boolean;
  menuMode: string;
  highlight: HighlightValue;
  rendition: any;
  chapterDocIndex: number;
  readerMode: string;
  t: (title: string) => string;
}
export interface PopupReferStates {
  rect: any;
  isOpenMenu: boolean;
  footnote: string;
  href: string;
  isJump: boolean;
  returnPosition: any;
}
