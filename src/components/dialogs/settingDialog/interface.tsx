import PluginModel from "../../../models/Plugin";
import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleSettingDrive: (settingDrive: string) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  handleFetchDataSourceList: () => void;
  handleFetchDefaultSyncOption: () => void;
  handleFetchLoginOptionList: () => void;
  handleLoginOptionList: (
    loginOptionList: { email: string; provider: string }[]
  ) => void;
  handleFetchAuthed: () => void;
  handleLoadingDialog: (isShow: boolean) => void;
  t: (title: string) => string;
  handleFetchBooks: () => void;
  handleFetchPlugins: () => void;
  handleFetchUserInfo: () => void;
  plugins: PluginModel[];
  loginOptionList: { email: string; provider: string }[];
  defaultSyncOption: string;
  isAuthed: boolean;
  settingMode: string;
  settingDrive: string;
}
export interface SettingInfoState {
  isTouch: boolean;
  isPreventTrigger: boolean;
  isMergeWord: boolean;
  appSkin: string;
  storageLocation: string;
  isOpenBook: boolean;
  isDisablePopup: boolean;
  isDisableAutoScroll: boolean;
  isDisableTrashBin: boolean;
  isDeleteShelfBook: boolean;
  isPreventSleep: boolean;
  isOpenInMain: boolean;
  isPrecacheBook: boolean;
  isUseBuiltIn: boolean;
  isDisableCrop: boolean;
  isOverwriteLink: boolean;
  isOverwriteText: boolean;
  isDisablePDFCover: boolean;
  isAutoFullscreen: boolean;
  isHideShelfBook: boolean;
  isPreventAdd: boolean;
  isLemmatizeWord: boolean;
  isAddNew: boolean;
  currentThemeIndex: number;
  driveConfig: any;
  loginConfig: any;
  settingLogin: string;
}
