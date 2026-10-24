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
  settingDrive: string;
}
export interface SettingInfoState {


  isMergeWord: boolean;

  isImportPath: boolean;


  isDisableTrashBin: boolean;
  isDeleteShelfBook: boolean;
  isPreventSleep: boolean;
  isAlwaysOnTop: boolean;
  isAutoMaximizeWin: boolean;
  isAutoLaunch: boolean;
  isMinimizeToTray: boolean;
  isOpenInMain: boolean;
  isDisableUpdate: boolean;
  isExportOriginalName: boolean;
  isDisableAI: boolean;
  isUseOriginalName: boolean;
  isAIAnalyzeTitle: boolean;
  isPrecacheBook: boolean;
  isUseBuiltIn: boolean;
  isDeleteOriginal: boolean;

  isHideShelfBook: boolean;
  isPreventAdd: boolean;
  startupShelf: string;
}
