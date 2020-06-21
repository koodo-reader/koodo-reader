export interface SortDialogProps {
  sortCode: { sort: number; order: number };
  isSortDisplay: boolean;
  handleSortCode: (sortCode: { sort: number; order: number }) => void;
  handleSortDisplay: (isSort: boolean) => void;
}
