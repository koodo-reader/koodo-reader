import HtmlBookModel from "../../../model/HtmlBook";
export interface ContentListProps {
  currentEpub: any;
  chapters: any;
  htmlBook: HtmlBookModel;
  renderFunc: (id: string) => void;
  handleCurrentChapter: (currentChapter: string) => void;
}
export interface ContentListState {
  chapters: any;
  currentIndex: number;
  currentChapter: string;
  isCollapsed: boolean;
  isExpandContent: boolean;
}
