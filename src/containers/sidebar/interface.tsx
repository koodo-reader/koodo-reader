import { RouteComponentProps } from "react-router";

export interface SidebarProps extends RouteComponentProps<any> {
  mode: string;
  handleMode: (mode: string) => void;
  handleSearch: (isSearch: boolean) => void;
  handleCollapse: (isCollapsed: boolean) => void;
  handleDragToLove: (isDragToLove: boolean) => void;
  handleDragToDelete: (isDragToLove: boolean) => void;
  handleSortDisplay: (isSortDisplay: boolean) => void;
}

export interface SidebarState {
  index: number;
  hoverIndex: number;
  isCollapsed: boolean;
}
