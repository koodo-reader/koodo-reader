export interface ThemeListProps {
  currentEpub: any;
  t: (title: string) => string;
  renderFunc: () => void;
}

export interface ThemeListState {
  currentBackgroundIndex: number;
  currentTextIndex: number;
  isShowTextPicker: boolean;
  isShowBgPicker: boolean;
}
