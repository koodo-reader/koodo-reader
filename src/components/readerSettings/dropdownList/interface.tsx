export interface DropdownListProps {
  t: (title: string) => string;
  renderBookFunc: () => void;
}
export interface DropdownListState {
  currentFontFamilyValue: string;
  currentSubFontFamilyValue: string;
  currentLineHeightValue: string;
  currentTextAlignValue: string;
  chineseConversionValue: string;
  currentTextOrientationValue: string;
}
