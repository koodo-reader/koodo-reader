export interface ModeControlProps {
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  renderFunc: () => void;
  t: (title: string) => string;
  currentEpub: any;
}

export interface ModeControlState {
  readerMode: string;
}
