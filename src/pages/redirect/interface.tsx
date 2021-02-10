import { RouteComponentProps } from "react-router";
export interface RedirectProps extends RouteComponentProps<any> {
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleLoadingDialog: (isShowLoading: boolean) => void;
}

export interface RedirectState {
  isAuthed: boolean;
  isError: boolean;
  isCopied: boolean;
  token: string;
}
