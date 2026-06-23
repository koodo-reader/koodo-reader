import { RouteComponentProps } from "react-router-dom";
import { HighlightStyleType } from "../../../constants/highlightList";

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
  isDisablePDFCover: boolean;
  isDisableCrop: boolean;
  isShowShelfBookCount: boolean;
  isCustomSystemCSS: boolean;
  customSystemCSS: string;
  ttsHighlightStyleType: HighlightStyleType;
  ttsHighlightColor: string;
  isShowTtsCustomColorPicker: boolean;
  pendingTtsCustomColor: string;
  searchHighlightStyleType: HighlightStyleType;
  searchHighlightColor: string;
  isShowSearchCustomColorPicker: boolean;
  pendingSearchCustomColor: string;
}
