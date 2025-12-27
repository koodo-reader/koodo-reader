import { RouteComponentProps } from "react-router-dom";

export interface LocalFileDialogProps extends RouteComponentProps<any> {
  handleLocalFileDialog: (isBackup: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  t: (title: string) => string;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleFetchBooks: () => void;
  isAuthed: boolean;
}
export interface LocalFileDialogState {
  isFinish: boolean;
  hasLocalAccess: boolean;
  status: any;
}
