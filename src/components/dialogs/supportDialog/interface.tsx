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
  handleLoginOptionList: (
    loginOptionList: { email: string; provider: string }[]
  ) => void;
  handleFetchUserInfo: () => void;
  handleFetchDataSourceList: () => void;
  handleFetchDefaultSyncOption: () => void;
}
export interface SupporDialogState {
  isRedeemCode: boolean;
  isExitPro: boolean;
  redeemCode: string;
}
