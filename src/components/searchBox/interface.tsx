import htmlBookModel from "../../models/HtmlBook";
export interface SearchBoxProps {
  isSearch: boolean;
  isNavSearch: boolean;
  isReading: boolean;
  isNavLocked: boolean;
  mode: string;
  tabMode: string;
  width: string;
  height: string;
  htmlBook: htmlBookModel;
  shelfTitle: string;
  handleSearchResults: (results: number[]) => void;
  handleSearch: (isSearch: boolean) => void;
  handleNavSearchState: (state: string) => void;
  handleSearchList: (searchList: any) => void;
  t: any;
}
export interface SearchBoxState {
  isFocused: boolean;
}
