
export interface SettingInfoProps {
}
export interface SettingInfoState {

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
  searchHighlightStyleType: string;
  searchHighlightColor: string;
}
