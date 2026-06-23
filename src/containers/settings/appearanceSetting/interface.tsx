import { RouteComponentProps } from "react-router-dom";
import { HighlightConfig } from "../../../constants/highlightList";

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
  ttsHighlightConfig: HighlightConfig;
  isShowTtsCustomColorPicker: boolean;
  pendingTtsCustomColor: string;
  searchHighlightConfig: HighlightConfig;
  isShowSearchCustomColorPicker: boolean;
  pendingSearchCustomColor: string;
}
