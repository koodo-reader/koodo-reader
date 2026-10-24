import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  t: (title: string, options?: any) => string;

  handleFetchBooks: () => void;
}
export interface SettingInfoState {
  storageLocation: string;
  snapshotList: { file: string; time: number }[];
  ttsCacheSize: string;
  tempCacheSize: string;
  exportNotesFormat: string;
  exportHighlightsFormat: string;
  exportWordsFormat: string;
  isEnableDiscordRPC: boolean;
  isEnableKoReaderSync: boolean;
  isEnableNotionSync: boolean;
  isEnableYuqueSync: boolean;
  isEnableReadwiseSync: boolean;
  isEnableMarkdownSync: boolean;
  isEnableEudicSync: boolean;
  isEnableAnkiSync: boolean;

  isEnableSiYuanSync: boolean;
  [key: string]: any;
}
