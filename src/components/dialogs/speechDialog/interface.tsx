import BookModel from "../../../models/Book";
import Plugin from "../../../models/Plugin";

export interface SpeechDialogProps {
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  currentBook: BookModel;
  handleSetting: (isSettingOpen: boolean) => void;
  handleSpeechDialog: (isAboutOpen: boolean) => void;
  handleFetchPlugins: () => void;
  isAuthed: boolean;
  t: (title: string) => string;
  plugins: Plugin[];
}
export interface SpeechDialogState {
  isShowExportAll: boolean;
  isConvertPDF: boolean;
}
