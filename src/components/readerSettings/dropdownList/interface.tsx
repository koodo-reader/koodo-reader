export interface DropdownListProps {
  t: (title: string) => string;
  renderFunc: () => void;
}
export interface DropdownListState {
  currentFontFamilyIndex: number;
  currentLineHeightIndex: number;
  currentTextAlignIndex: number;
  chineseConversionIndex: number;
}
