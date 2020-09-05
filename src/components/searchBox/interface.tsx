import BookModel from "../../model/Book";
export interface SearchBoxProps {
  books: BookModel[];
  isSearch: boolean;
  isNavSearch: boolean;
  mode: string;
  width: string;
  height: string;
  currentEpub: any;
  handleSearchBooks: (results: number[]) => void;
  handleSearch: (isSearch: boolean) => void;
  handleSearchState: (isSearch: boolean) => void;
  handleSearchList: (searchList: any) => void;
}
