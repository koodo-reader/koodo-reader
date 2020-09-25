export interface ModeControlProps {
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}

export interface ModeControlState {
  readerMode: string;
}
