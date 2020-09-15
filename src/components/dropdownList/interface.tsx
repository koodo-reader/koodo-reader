export interface DropdownListProps {
  currentEpub: any;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface DropdownListState {
  currentFontFamilyIndex: number;
  currentLineHeightIndex: number;
}
