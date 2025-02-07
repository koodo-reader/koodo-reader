import { RouteComponentProps } from "react-router";
export interface RedirectProps extends RouteComponentProps<any> {
  handleLoadingDialog: (isShowLoading: boolean) => void;
  t: (title: string) => string;
}

export interface RedirectState {
  isAuthed: boolean;
  isError: boolean;
  token: string;
}
