import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleMergeWord: (isMergeWord: boolean) => void;
  t: (title: string) => string;
  isAuthed: boolean;
}
export interface SettingInfoState {
  isTouch: boolean;
  isPreventTrigger: boolean;
  isMergeWord: boolean;
  isOpenBook: boolean;
  isDisablePopup: boolean;
  isDisableAutoScroll: boolean;
  isManualScroll: boolean;



  isOpenInMain: boolean;

  isOverwriteLink: boolean;
  isOverwriteText: boolean;
  isOverwriteBackground: boolean;
  isAutoFullscreen: boolean;
  isAutoMaximize: boolean;



}
