import PluginModel from "../../../models/Plugin";
import type { BuiltinPluginMarketItem } from "../../../utils/plugins/types";
export interface SettingInfoProps {















}
export interface SettingInfoState {
  isAddNew: boolean;
  availablePlugins: BuiltinPluginMarketItem[];
  expandedPluginKey: string | null;
  activePluginTab: string;
}
