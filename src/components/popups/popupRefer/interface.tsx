import BookModel from "../../../models/Book";

export interface PopupReferProps {

  menuMode: string;
  rendition: any;
  chapterDocIndex: number;
}
export interface PopupReferStates {
  rect: any;
  isOpenMenu: boolean;
  footnote: string;
  href: string;
  isJump: boolean;
  returnPosition: any;
}
