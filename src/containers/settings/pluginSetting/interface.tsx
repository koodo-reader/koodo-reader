import PluginModel from "../../../models/Plugin";
import type { BuiltinPluginMarketItem } from "../../../utils/plugins/types";
import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {










  t: (title: string) => string;

  handleFetchPlugins: () => void;
  plugins: PluginModel[];




}
export interface SettingInfoState {
  isAddNew: boolean;
  availablePlugins: BuiltinPluginMarketItem[];
  expandedPluginKey: string | null;
  activePluginTab: string;
}
