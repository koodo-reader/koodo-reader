export interface ThemeListProps {
  currentEpub: any;
  t: (title: string) => string;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  renderFunc: () => void;
}

export interface ThemeListState {
  currentBackgroundIndex: number;
  currentTextIndex: number;
  isShowTextPicker: boolean;
  isShowBgPicker: boolean;
}
