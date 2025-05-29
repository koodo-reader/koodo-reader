import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";
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
  isPurePdf: boolean;
  isHideHeader: boolean;
  isHidePageButton: boolean;
  isHideAIButton: boolean;
  isHideMenuButton: boolean;
}
