export interface SettingSwitchProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface SettingSwitchState {
  isUseBackground: boolean;
  isShowFooter: boolean;
  isBold: boolean;
  isShowHeader: boolean;
}
