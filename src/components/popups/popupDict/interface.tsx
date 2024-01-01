import BookModel from "../../../model/Book";
export interface PopupDictProps {
  originalText: string;
  currentBook: BookModel;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  t: (title: string) => string;
}
export interface PopupDictState {
  dictText: string;
  word: string;
  prototype: string;
  wikiCode: string;
  dictService: string;
  dictTarget: string;
}
