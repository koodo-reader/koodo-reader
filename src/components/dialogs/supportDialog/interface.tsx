import BookModel from "../../../models/Book";
export interface SupporDialogProps {
  currentBook: BookModel;
  books: BookModel[];
  isShowSupport: boolean;
  isAuthed: boolean;
  userInfo: any;
  t: (title: string) => string;
  handleShowSupport: (isShowSupport: boolean) => void;
  handleNewWarning: (isNewWarning: boolean) => void;
  handleFetchAuthed: () => void;
  handleLoginOptionList: (loginOptionList: string[]) => void;
  handleFetchUserInfo: () => void;
}
export interface SupporDialogState {}
