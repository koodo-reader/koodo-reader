import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";

export interface ConvertDialogProps {
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  currentBook: BookModel;
  plugins: PluginModel[];
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (mode: string) => void;
  handleConvertDialog: (isAboutOpen: boolean) => void;
  isAuthed: boolean;
  t: (title: string) => string;
  isSettingLocked: boolean;
  isDockedRight: boolean;
}
export interface ConvertDialogState {
  isShowExportAll: boolean;
  isConvertPDF: boolean;
}
