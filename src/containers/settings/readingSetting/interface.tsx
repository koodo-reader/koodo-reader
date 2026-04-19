import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
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
  isDisableTrashBin: boolean;
  isDeleteShelfBook: boolean;
  isPreventSleep: boolean;
  isOpenInMain: boolean;
  isPrecacheBook: boolean;
  isOverwriteLink: boolean;
  isOverwriteText: boolean;
  isAutoFullscreen: boolean;
  isAutoMaximize: boolean;
  isHideShelfBook: boolean;
  isPreventAdd: boolean;
  isLemmatizeWord: boolean;
}
