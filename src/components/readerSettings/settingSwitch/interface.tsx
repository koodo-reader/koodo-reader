export interface SettingSwitchProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  htmlBook;
  renderFunc: () => void;
  t: (title: string) => string;
}
export interface SettingSwitchState {
  isHideBackground: boolean;
  isHideFooter: boolean;
  isBold: boolean;
  isIndent: boolean;
  isShadow: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isInvert: boolean;
  isHideHeader: boolean;
  isHidePageButton: boolean;
  isHideMenuButton: boolean;
}
