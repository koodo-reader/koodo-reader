import HtmlBookModel from "../../../model/HtmlBook";
export interface ContentListProps {
  currentEpub: any;
  chapters: any;
  htmlBook: HtmlBookModel;
}
export interface ContentListState {
  chapters: any;
  currentIndex: number;
  isCollapsed: boolean;
  isExpandContent: boolean;
}
