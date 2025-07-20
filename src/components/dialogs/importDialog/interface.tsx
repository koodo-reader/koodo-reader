import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
import { RouteComponentProps } from "react-router-dom";

export interface ImportDialogProps extends RouteComponentProps<any> {
  handleImportDialog: (isOpenImportDialog: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  t: (title: string) => string;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleImportBookFunc: (importBookFunc: (file: any) => Promise<void>) => void;
  handleFetchBooks: () => void;
  importBookFunc: (file: any) => Promise<void>;
  handleSetting: (isShow: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleSettingDrive: (settingDrive: string) => void;
  isOpenTokenDialog: boolean;
  isAuthed: boolean;
  books: BookModel[];
  notes: NoteModel[];
  dataSourceList: string[];
  bookmarks: BookmarkModel[];
}
export interface ImportDialogState {
  isBackup: string;
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
