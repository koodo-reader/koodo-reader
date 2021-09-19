export interface SettingPanelProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  t: (title: string) => string;
}
export interface SettingPanelState {
  readerMode: string;
  isSettingLocked: boolean;
}
