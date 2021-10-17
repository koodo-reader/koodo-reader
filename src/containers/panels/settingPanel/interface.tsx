import BookModel from "../../../model/Book";
export interface SettingPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  locations: any;
  isReading: boolean;
  t: (title: string) => string;
}
export interface SettingPanelState {
  readerMode: string;
  isSettingLocked: boolean;
}
