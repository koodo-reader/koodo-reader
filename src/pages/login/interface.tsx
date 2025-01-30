import { RouteComponentProps } from "react-router";
export interface LoginProps extends RouteComponentProps<any> {
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleFetchAuthed: () => void;
  t: (title: string) => string;
}

export interface LoginState {
  currentStep: number;
}
