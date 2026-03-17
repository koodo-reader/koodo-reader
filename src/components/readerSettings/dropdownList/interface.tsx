export interface DropdownListProps {
  t: (title: string) => string;
  renderBookFunc: () => void;
  handleHideBackground: (isHideBackground: boolean) => void;
}
export interface DropdownListState {
  currentFontFamilyValue: string;
  currentSubFontFamilyValue: string;
  currentLineHeightValue: string;
  currentTextAlignValue: string;
  chineseConversionValue: string;
  currentTextOrientationValue: string;
}
