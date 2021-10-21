export interface DropdownListProps {
  currentEpub: any;
  t: (title: string) => string;
  renderFunc: (id: string) => void;
}
export interface DropdownListState {
  currentFontFamilyIndex: number;
  currentLineHeightIndex: number;
  currentTextAlignIndex: number;
}
