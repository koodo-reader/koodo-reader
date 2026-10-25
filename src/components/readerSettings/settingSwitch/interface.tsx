import BookModel from "../../../models/Book";
export interface SettingSwitchProps {
  group?: string;
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
