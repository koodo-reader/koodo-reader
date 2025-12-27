import { RouteComponentProps } from "react-router-dom";

export interface BackupDialogProps extends RouteComponentProps<any> {
  handleBackupDialog: (isBackup: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  t: (title: string) => string;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleFetchBooks: () => void;
  isAuthed: boolean;

  dataSourceList: string[];
}
export interface BackupDialogState {
  isBackup: string;
  currentDrive: string;
  isFinish: boolean;
}
