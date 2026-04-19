import BookModel from "../../../models/Book";

export interface DropdownListProps {
  t: (title: string) => string;
  isAuthed: boolean;
  currentBook: BookModel;
  renderBookFunc: () => void;
  handleHideBackground: (isHideBackground: boolean) => void;
  handleTextOrientation: (textOrientation: string) => void;
  handleSetting: (isOpenSetting: boolean) => void;
  handleSettingMode: (mode: string) => void;
}
export interface DropdownListState {
  currentFontFamilyValue: string;
  currentSubFontFamilyValue: string;
  currentLineHeightValue: string;
  currentTextAlignValue: string;
  chineseConversionValue: string;
  fullTranslationModeValue: string;
  currentTextOrientationValue: string;
  currentSelectActionValue: string;
}
