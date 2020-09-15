export interface SingleControlProps {
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}

export interface SingleControlState {
  readerMode: string;
}
