export interface ThemeListProps {
  currentEpub: any;
  t: (title: string) => string;
  renderFunc: (id: string) => void;
}

export interface ThemeListState {
  currentBackgroundIndex: number;
  currentTextIndex: number;
  isShowTextPicker: boolean;
  isShowBgPicker: boolean;
}
