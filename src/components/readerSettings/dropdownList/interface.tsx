export interface DropdownListProps {
  currentEpub: any;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  t: (title: string) => string;
}
export interface DropdownListState {
  currentFontFamilyIndex: number;
  currentLineHeightIndex: number;
  currentTextAlignIndex: number;
}
