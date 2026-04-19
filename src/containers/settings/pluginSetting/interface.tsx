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
  plugins: PluginModel[];
  loginOptionList: { email: string; provider: string }[];
  defaultSyncOption: string;
  isAuthed: boolean;
  settingDrive: string;
}
export interface SettingInfoState {
  isAddNew: boolean;
  availablePlugins: any[];
  expandedPluginKey: string | null;
  activePluginTab: string;
}
