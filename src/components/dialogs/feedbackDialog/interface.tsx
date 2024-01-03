import BookModel from "../../../model/Book";
export interface FeedbackDialogProps {
  handleFeedbackDialog: (isShow: boolean) => void;
  currentBook: BookModel;
  driveName: string;
  title: string;
  url: string;
  t: (title: string) => string;
}
export interface FeedbackDialogState {
  isNew: boolean;
  isSending: boolean;
  developerVersion: string;
}
