export interface ModeControlProps {
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  t: (title: string) => string;
}

export interface ModeControlState {
  readerMode: string;
}
