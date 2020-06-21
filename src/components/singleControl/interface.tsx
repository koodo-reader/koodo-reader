export interface SingleControlProps {
  handleSingle: (mode: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}

export interface SingleControlState {
  isSingle: boolean;
}
