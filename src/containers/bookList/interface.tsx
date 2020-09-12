import BookModel from "../../model/Book";

export interface BookListProps {
  books: BookModel[];
  covers: { key: string; url: string }[];
  epubs: object[];
  mode: string;
  shelfIndex: number;
  searchResults: number[];
  isSearch: boolean;
  isSort: boolean;
  isList: string;
  sortCode: { sort: number; order: number };
  handleFetchList: () => void;
}
