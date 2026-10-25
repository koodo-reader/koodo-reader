export interface ThemeListProps {

}

export interface ThemeListState {
  currentBackgroundIndex: number;
  currentTextIndex: number;
  isShowTextPicker: boolean;
  isShowBgPicker: boolean;
  bgColorInput: string;
  textColorInput: string;
  pendingBgColor: string;
  pendingTextColor: string;
}
