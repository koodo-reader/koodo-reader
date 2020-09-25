import BookModel from "../../model/Book";

export interface BookListProps {
  books: BookModel[];
  mode: string;
  shelfIndex: number;
  searchResults: number[];
  isSearch: boolean;
  isSort: boolean;
  isList: string;
  sortCode: { sort: number; order: number };
  handleFetchList: () => void;
  handleMode: (mode: string) => void;
  handleShelfIndex: (index: number) => void;
}
export interface BookListState {
  shelfIndex: number;
}
