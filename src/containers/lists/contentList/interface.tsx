import HtmlBookModel from "../../../models/HtmlBook";
import BookModel from "../../../models/Book";
export interface ContentListProps {


}
export interface ContentListState {
  chapters: any;



  isExpandContent: boolean;
  expandedItems: Set<string>;
  isSearchOpen: boolean;
  searchKeyword: string;
  isComposing: boolean;
  chapterPages: number[];
}
