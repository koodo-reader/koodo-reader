import { RouteComponentProps } from "react-router-dom";
import { FontItem } from "../../../utils/file/fontUtil";

export interface SettingInfoProps extends RouteComponentProps<any> {
  t: (title: string) => string;
  renderBookFunc?: () => void;
}

export interface InstalledFont extends FontItem {
  key: string;
}

export interface SettingInfoState {
  fonts: InstalledFont[];
  loadedUrls: Record<string, string>;
  isLoading: boolean;
  previewFont: InstalledFont | null;
  previewLoading: boolean;
  appFontKey: string;
  readerFontKey: string;
  showFeatured: boolean;
  expandedFamily: string;
  downloadingId: string;
  downloadProgress: number;
}
