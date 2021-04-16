export interface SettingSwitchProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface SettingSwitchState {
  isUseBackground: boolean;
  isHideFooter: boolean;
  isBold: boolean;
  isShadow: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isHideHeader: boolean;
}
