import BookModel from "../../../models/Book";
export interface SettingSwitchProps {
  currentBook: BookModel;
  renderBookFunc: () => void;
  handleHideFooter: (isHideFooter: boolean) => void;
  handleHideHeader: (isHideHeader: boolean) => void;
  t: (title: string) => string;
  handleHideBackground: (isHideBackground: boolean) => void;
  handleShowBorder: (isShowPageBorder: boolean) => void;
  handleBackgroundColor: (color: string) => void;
}
export interface SettingSwitchState {
  isHideBackground: boolean;
  isHideFooter: boolean;
  isBold: boolean;
  isIndent: boolean;
  isShadow: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isInvert: boolean;
  isStartFromEven: boolean;
  isRevertDirection: boolean;
  isShowTotalPage: boolean;
  isAllowScript: boolean;
  isHyphenation: boolean;
  isOrphanWidow: boolean;
  isKeepPDFBackground: boolean;
  isBionic: boolean;
  isHideHeader: boolean;
  isShowPageBorder: boolean;
  isCustomBookCSS: boolean;
  customBookCSS: string;
  isSeperateStyle: boolean;
}
