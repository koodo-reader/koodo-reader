import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";

export interface AboutDialogProps {
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  isNewWarning: boolean;
  books: BookModel[];
  notes: NoteModel[];
  deletedBooks: BookModel[];
  handleSetting: (isSettingOpen: boolean) => void;
  handleAbout: (isAboutOpen: boolean) => void;
  handleFeedbackDialog: (isShow: boolean) => void;
  t: (title: string) => string;
}
export interface AboutDialogState {
  isShowExportAll: boolean;
}
