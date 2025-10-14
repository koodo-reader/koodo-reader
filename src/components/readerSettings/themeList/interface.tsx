export interface ThemeListProps {
  t: (title: string) => string;
  renderBookFunc: () => void;
  handleBackgroundColor: (color: string) => void;
}

export interface ThemeListState {
  currentBackgroundIndex: number;
  currentTextIndex: number;
  isShowTextPicker: boolean;
  isShowBgPicker: boolean;
}
