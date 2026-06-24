import { RouteComponentProps } from "react-router-dom";
import { FontItem } from "../../../utils/file/fontUtil";

export interface SettingInfoProps extends RouteComponentProps<any> {
  t: (title: string) => string;
}

export interface InstalledFont extends FontItem {
  key: string;
}

export interface SettingInfoState {
  fonts: InstalledFont[];
  loadedUrls: Record<string, string>;
  isLoading: boolean;
  showFeatured: boolean;
  expandedFamily: string;
  downloadingId: string;
  downloadProgress: number;
}
