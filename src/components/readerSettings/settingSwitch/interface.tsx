import BookModel from "../../../model/Book";
import HtmlBookModel from "../../../model/HtmlBook";
export interface SettingSwitchProps {
  currentBook: BookModel;
  locations: any;
  isReading: boolean;
  htmlBook: HtmlBookModel;
  renderBookFunc: () => void;
  t: (title: string) => string;
}
export interface SettingSwitchState {
  isHideBackground: boolean;
  isHideFooter: boolean;
  isBold: boolean;
  isIndent: boolean;
  isSliding: boolean;
  isShadow: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isInvert: boolean;
  isHideHeader: boolean;
  isHidePageButton: boolean;
  isHideMenuButton: boolean;
}
