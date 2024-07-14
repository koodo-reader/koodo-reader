import BookModel from "../../../models/Book";
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
  dictService: string;
  dictTarget: string;
  isAddNew: boolean;
}
