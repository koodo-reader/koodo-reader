import { RouteComponentProps } from "react-router";
export interface RedirectProps extends RouteComponentProps<any> {}

export interface RedirectState {
  isAuthed: boolean;
  isError: boolean;
  isCopied: boolean;
  token: string;
}
