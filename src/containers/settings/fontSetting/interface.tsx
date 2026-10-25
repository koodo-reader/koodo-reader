import { FontItem } from "../../../utils/file/fontUtil";

export interface SettingInfoProps {
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
  expandedFamily: string;
  downloadingId: string;
  downloadProgress: number;
}
