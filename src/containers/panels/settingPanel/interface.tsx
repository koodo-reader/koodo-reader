export interface SettingPanelProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface SettingPanelState {
  readerMode: string;
  isSettingLocked: boolean;
}
