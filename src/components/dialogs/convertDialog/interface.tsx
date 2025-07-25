import BookModel from "../../../models/Book";

export interface ConvertDialogProps {
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  currentBook: BookModel;
  handleSetting: (isSettingOpen: boolean) => void;
  handleConvertDialog: (isAboutOpen: boolean) => void;
  handleFeedbackDialog: (isShow: boolean) => void;

  t: (title: string) => string;
}
export interface ConvertDialogState {
  isShowExportAll: boolean;
  isConvertPDF: boolean;
}
