import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  t: (title: string) => string;
}
export interface SettingInfoState {
  appSkin: string;
  currentThemeIndex: number;
  isShowCustomColorPicker: boolean;
  customColor: string;
  pendingCustomColor: string;
  isDisablePDFCover: boolean;
  isDisableCrop: boolean;
  isCustomSystemCSS: boolean;
  customSystemCSS: string;
}
