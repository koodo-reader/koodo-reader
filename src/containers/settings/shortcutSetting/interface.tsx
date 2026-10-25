
export interface ShortcutSettingProps {
}

export type RecordingTarget = {
  action: string;
  index: number;
} | null;

export interface ShortcutSettingState {
  recording: RecordingTarget;
}
