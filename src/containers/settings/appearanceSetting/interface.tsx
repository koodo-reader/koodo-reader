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
  fontListVersion: number;
  fontOptions: { label: string; value: string }[];
  isDisablePDFCover: boolean;
  isDisableCrop: boolean;
  isShowShelfBookCount: boolean;
  isCustomSystemCSS: boolean;
  customSystemCSS: string;
  ttsHighlightStyleType: string;
  ttsHighlightColor: string;
  isShowTtsCustomColorPicker: boolean;
  pendingTtsCustomColor: string;
  searchHighlightStyleType: string;
  searchHighlightColor: string;
  isShowSearchCustomColorPicker: boolean;
  pendingSearchCustomColor: string;
}
