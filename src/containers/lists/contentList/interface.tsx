import HtmlBookModel from "../../../models/HtmlBook";
import BookModel from "../../../models/Book";
export interface ContentListProps {
  currentBook: BookModel;
  currentChapter: string;
  currentChapterIndex: number;
  chapters: any;
  htmlBook: HtmlBookModel;
  renderBookFunc: (id: string) => void;
  handleCurrentChapter: (currentChapter: string) => void;
  handleCurrentChapterIndex: (currentChapterIndex: number) => void;
}
export interface ContentListState {
  chapters: any;
  currentIndex: number;
  currentChapterIndex: number;
  isCollapsed: boolean;
  isExpandContent: boolean;
  expandedItems: Set<string>;
}
