import { RouteComponentProps } from "react-router";

export interface EmptyPageProps extends RouteComponentProps<any> {
  mode: string;
  isCollapsed: boolean;
  isSelectBook: boolean;
  shelfTitle: string;
  handleShelf: (shelfTitle: string) => void;
  handleMode: (mode: string) => void;
}
export interface EmptyPageState {
  isOpenDelete: boolean;
}
