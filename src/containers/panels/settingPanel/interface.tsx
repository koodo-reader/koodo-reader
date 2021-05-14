export interface SettingPanelProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  t: (title: string) => string;
}
export interface SettingPanelState {
  readerMode: string;
  isSettingLocked: boolean;
}
