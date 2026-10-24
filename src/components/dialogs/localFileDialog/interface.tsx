import { RouteComponentProps } from "react-router-dom";

export interface LocalFileDialogProps extends RouteComponentProps<any> {
  handleLocalFileDialog: (isBackup: boolean) => void;

  t: (title: string) => string;

  handleFetchBooks: () => void;

}
export interface LocalFileDialogState {
  isFinish: boolean;
  status: any;
}
