export interface SidebarProps {
  mode: string;
  handleMode: (mode: string) => void;
  handleShelfIndex: (index: number) => void;
}

export interface SidebarState {
  index: number;
  isCollapse: boolean;
  shelfIndex: number;
}
