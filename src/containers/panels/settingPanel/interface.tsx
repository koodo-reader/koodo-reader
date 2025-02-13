import BookModel from "../../../models/Book";
export interface SettingPanelProps {
  currentBook: BookModel;
  locations: any;
  isReading: boolean;
  readerMode: string;
  t: (title: string) => string;
}
export interface SettingPanelState {
  isSettingLocked: boolean;
}
