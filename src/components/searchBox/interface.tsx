import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import htmlBookModel from "../../model/HtmlBook";
export interface SearchBoxProps {
  books: BookModel[];
  isSearch: boolean;
  isNavSearch: boolean;
  isReading: boolean;
  mode: string;
  tabMode: string;
  notes: NoteModel[];
  digests: NoteModel[];
  width: string;
  height: string;
  currentBook: any;
  htmlBook: htmlBookModel;
  shelfIndex: number;
  handleSearchResults: (results: number[]) => void;
  handleSearch: (isSearch: boolean) => void;
  handleSearchState: (isSearch: boolean) => void;
  handleSearchList: (searchList: any) => void;
  t: any;
}
