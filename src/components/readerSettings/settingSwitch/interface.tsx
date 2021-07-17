export interface SettingSwitchProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  htmlBook;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  renderFunc: () => void;
}
export interface SettingSwitchState {
  isUseBackground: boolean;
  isHideFooter: boolean;
  isBold: boolean;
  isShadow: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isInvert: boolean;
  isHideHeader: boolean;
  isHidePageButton: boolean;
}
