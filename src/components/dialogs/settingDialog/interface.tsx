export interface SettingInfoProps {
  handleSetting: (isSettingOpen: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface SettingInfoState {
  language: string;
  isTouch: boolean;
  isOpenBook: boolean;
  isExpandContent: boolean;
  isAutoSync: boolean;
  isRememberSize: boolean;
}
