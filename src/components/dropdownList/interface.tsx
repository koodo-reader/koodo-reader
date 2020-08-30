export interface DropdownListProps {
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface DropdownListState {
  currentFontFamilyIndex: number;
  currentLineHeightIndex: number;
}
