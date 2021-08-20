import { RouteComponentProps } from "react-router";

export interface SidebarProps extends RouteComponentProps<any> {
  mode: string;
  isCollapsed: boolean;
  handleMode: (mode: string) => void;
  handleSearch: (isSearch: boolean) => void;
  handleCollapse: (isCollapsed: boolean) => void;
  handleSortDisplay: (isSortDisplay: boolean) => void;
  t: (title: string) => string;
}

export interface SidebarState {
  index: number;
  hoverIndex: number;
  isCollapsed: boolean;
}
