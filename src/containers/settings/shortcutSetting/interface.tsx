import { RouteComponentProps } from "react-router-dom";

export interface ShortcutSettingProps extends RouteComponentProps<any> {
  t: (title: string) => string;
}

export type RecordingTarget = {
  action: string;
  index: number;
} | null;

export interface ShortcutSettingState {
  recording: RecordingTarget;
}
