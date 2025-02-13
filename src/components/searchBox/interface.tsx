import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import htmlBookModel from "../../models/HtmlBook";
export interface SearchBoxProps {
  books: BookModel[];
  isSearch: boolean;
  isNavSearch: boolean;
  isReading: boolean;
  isNavLocked: boolean;
  mode: string;
  tabMode: string;
  notes: NoteModel[];
  digests: NoteModel[];
  width: string;
  height: string;
  currentBook: any;
  htmlBook: htmlBookModel;
  shelfTitle: string;
  handleSearchResults: (results: number[]) => void;
  handleSearch: (isSearch: boolean) => void;
  handleNavSearchState: (state: string) => void;
  handleSearchList: (searchList: any) => void;
  t: any;
}
