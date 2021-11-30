import HtmlBookModel from "../../../model/HtmlBook";
import BookModel from "../../../model/Book";
export interface ContentListProps {
  currentEpub: any;
  currentBook: BookModel;
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
