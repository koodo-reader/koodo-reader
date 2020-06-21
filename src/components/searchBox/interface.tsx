import BookModel from "../../model/Book";
export interface SearchBoxProps {
  books: BookModel[];
  isSearch: boolean;
  handleSearchBooks: (results: number[]) => void;
  handleSearch: (isSearch: boolean) => void;
}
