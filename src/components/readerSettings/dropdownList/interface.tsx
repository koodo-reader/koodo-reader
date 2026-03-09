export interface DropdownListProps {
  t: (title: string) => string;
  renderBookFunc: () => void;
}
export interface DropdownListState {
  currentFontFamilyIndex: number;
  currentSubFontFamilyIndex: number;
  currentLineHeightIndex: number;
  currentTextAlignIndex: number;
  chineseConversionIndex: number;
}
