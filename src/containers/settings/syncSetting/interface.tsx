import BookModel from "../../../models/Book";
import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleSettingDrive: (settingDrive: string) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  handleFetchDataSourceList: () => void;
  handleFetchDefaultSyncOption: () => void;





  handleLoadingDialog: (isShow: boolean) => void;
  t: (title: string) => string;
  handleFetchBooks: () => void;

  cloudSyncFunc: (userInfo: any) => Promise<void>;
  handleFetchUserInfo: () => Promise<any>;

  books: BookModel[];
  dataSourceList: string[];

  defaultSyncOption: string;
  isAuthed: boolean;
  settingDrive: string;
}
export interface SettingInfoState {
  isKeepLocal: boolean;
  isEnableKoodoSync: boolean;
  isDisableAutoSync: boolean;
  autoOffline: boolean;
  hideSyncProgress: boolean;
  driveConfig: any;
  scheduledSyncInterval: string;
  backupDrive: string;
  restoreDrive: string;
  showDefaultSyncAddGrid: boolean;
}
