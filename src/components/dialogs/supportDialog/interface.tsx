export interface SupporDialogProps {
  isShowSupport: boolean;
  isAuthed: boolean;
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
