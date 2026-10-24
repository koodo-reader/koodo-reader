import HtmlBookModel from "../../../models/HtmlBook";
import BookModel from "../../../models/Book";
export interface ContentListProps {
  currentBook: BookModel;
  currentChapter: string;
  currentChapterIndex: number;

  htmlBook: HtmlBookModel;

  handleCurrentChapter: (currentChapter: string) => void;
  handleCurrentChapterIndex: (currentChapterIndex: number) => void;
  handleJumpPosition: (jumpPosition: object | null) => void;
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
