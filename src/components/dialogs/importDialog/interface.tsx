
export interface ImportDialogProps {




  isOpenTokenDialog: boolean;

}
export interface ImportDialogState {

  currentDrive: string;
  currentPath: string;
  currentFileList: {
    name: string;
    size: number;
    type: string;
    modified: string;
    path: string;
  }[];
  selectedFileList: {
    name: string;
    size: number;
    type: string;
    modified: string;
    path: string;
  }[];
  isWaitList: boolean;
}
