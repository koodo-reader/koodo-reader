import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  t: (title: string) => string;
  isAuthed: boolean;
  handleFetchBooks: () => void;
}
export interface SettingInfoState {
  storageLocation: string;
  snapshotList: { file: string; time: number }[];
  exportNotesFormat: string;
  exportHighlightsFormat: string;
  isEnableDiscordRPC: boolean;
}
