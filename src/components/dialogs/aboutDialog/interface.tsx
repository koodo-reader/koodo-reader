import type BookModel from "../../../models/Book";

export interface AboutDialogProps {
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  isNewWarning: boolean;

  deletedBooks: BookModel[];
  handleSetting: (isSettingOpen: boolean) => void;
  handleAbout: (isAboutOpen: boolean) => void;

  t: (title: string) => string;
}
export interface AboutDialogState {
  isShowExportAll: boolean;
}
