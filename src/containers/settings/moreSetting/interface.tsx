import { RouteComponentProps } from "react-router-dom";

export interface MoreSettingProps extends RouteComponentProps<any> {
  t: (title: string) => string;
}

export interface MoreSettingState {
  protectionMethod: string;
  isLoading: boolean;
}
