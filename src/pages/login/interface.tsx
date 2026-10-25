export interface LoginProps {
}

export interface LoginState {
  currentStep: number;
  loginConfig: any;
  isSendingCode: boolean;
  countdown: number;
  serverRegion: string;
}
