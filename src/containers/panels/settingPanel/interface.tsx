import BookModel from "../../../models/Book";
export interface SettingPanelProps {
  currentBook: BookModel;
  locations: any;
  isReading: boolean;
  backgroundColor: string;
  isSettingLocked: boolean;
  readerMode: string;
  t: (title: string) => string;
  handleSettingLock: (isSettingLocked: boolean) => void;
  renderBookFunc: () => void;
}
export interface SettingPanelState {}
