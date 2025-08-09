import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
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
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  isOpenTokenDialog: boolean;
  plugins: PluginModel[];
  books: BookModel[];
  userInfo: any;
  dataSourceList: string[];
  loginOptionList: { email: string; provider: string }[];
  defaultSyncOption: string;
  isAuthed: boolean;
  settingMode: string;
  settingDrive: string;
}
export interface SettingInfoState {
  appSkin: string;
  storageLocation: string;
  isKeepLocal: boolean;
  isEnableKoodoSync: boolean;
  isDisableAutoSync: boolean;
  currentThemeIndex: number;
  driveConfig: any;
  loginConfig: any;
  settingLogin: string;
  isAddNew: boolean;
}
