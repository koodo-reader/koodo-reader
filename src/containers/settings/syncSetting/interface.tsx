import BookModel from "../../../models/Book";
export interface SettingInfoProps {








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
