import { RouteComponentProps } from "react-router";
export interface LoginProps extends RouteComponentProps<any> {
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleSetting: (isShow: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleSettingDrive: (settingDrive: string) => void;
  handleFetchAuthed: () => void;
  t: (title: string) => string;
  isSettingOpen: boolean;
  isShowLoading: boolean;
}

export interface LoginState {
  currentStep: number;
  loginConfig: any;
  isSendingCode: boolean;
  countdown: number;
}
