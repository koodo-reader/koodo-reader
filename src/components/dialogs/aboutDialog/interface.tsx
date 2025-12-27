import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";

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
