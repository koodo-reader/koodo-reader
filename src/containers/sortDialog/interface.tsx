export interface SortDialogProps {
  sortCode: { sort: number; order: number };
  isSortDisplay: boolean;
  handleSortCode: (sortCode: { sort: number; order: number }) => void;
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleSort: (isSort: boolean) => void;
}
