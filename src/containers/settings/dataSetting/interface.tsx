export interface SettingInfoProps {

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
