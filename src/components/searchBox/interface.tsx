import htmlBookModel from "../../models/HtmlBook";
export interface SearchBoxProps {
  isNavSearch?: boolean;
  mode?: string;
  width?: string;
  height?: string;

  handleNavSearchState?: (state: string) => void;
  handleSearchList?: (searchList: any) => void;
}
export interface SearchBoxState {
  isFocused: boolean;
}
