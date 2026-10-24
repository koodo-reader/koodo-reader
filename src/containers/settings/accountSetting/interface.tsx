import { RouteComponentProps } from "react-router-dom";
export interface SettingInfoProps extends RouteComponentProps<any> {
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;


  handleFetchDataSourceList: () => void;
  handleFetchDefaultSyncOption: () => void;
  handleFetchLoginOptionList: () => void;
  handleLoginOptionList: (
    loginOptionList: { email: string; provider: string }[]
  ) => void;
  handleFetchAuthed: () => void;

  t: (title: string) => string;


  handleFetchUserInfo: () => Promise<void>;
  cloudSyncFunc: () => Promise<void>;
  isShowSupport: boolean;


  userInfo: any;
  loginOptionList: { email: string; provider: string }[];

  isAuthed: boolean;

}
export interface SettingInfoState {

  isRedeemCode: boolean;
  redeemCode: string;
  loginConfig: any;
  settingLogin: string;
  showLoginOptions: boolean;
  isSendingCode: boolean;
  countdown: number;
}
