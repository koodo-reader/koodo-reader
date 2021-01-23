export interface SortDialogProps {
  bookSortCode: { sort: number; order: number };
  noteSortCode: { sort: number; order: number };
  isSortDisplay: boolean;
  mode: string;
  handleBookSortCode: (bookSortCode: { sort: number; order: number }) => void;
  handleNoteSortCode: (bookSortCode: { sort: number; order: number }) => void;
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleBookSort: (isSort: boolean) => void;
  handleNoteSort: (isSort: boolean) => void;
}
export interface SortDialogState {
  isNote: boolean;
}
