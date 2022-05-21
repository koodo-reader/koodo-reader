import HtmlBookModel from "../../../model/HtmlBook";
import BookModel from "../../../model/Book";
export interface ContentListProps {
  currentBook: BookModel;
  chapters: any;
  htmlBook: HtmlBookModel;
  renderBookFunc: (id: string) => void;
  handleCurrentChapter: (currentChapter: string) => void;
}
export interface ContentListState {
  chapters: any;
  currentIndex: number;
  isCollapsed: boolean;
  isExpandContent: boolean;
}
