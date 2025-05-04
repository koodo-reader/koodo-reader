import BookModel from "../../../models/Book";
export interface SettingPanelProps {
  currentBook: BookModel;
  locations: any;
  isReading: boolean;
  isSettingLocked: boolean;
  readerMode: string;
  t: (title: string) => string;
  handleSettingLock: (isSettingLocked: boolean) => void;
}
export interface SettingPanelState {}
