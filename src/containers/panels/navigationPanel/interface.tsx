import BookModel from "../../../models/Book";
import BookmarkModel from "../../../models/Bookmark";
import HtmlBookModel from "../../../models/HtmlBook";

export interface NavigationPanelProps {
  currentBook: BookModel;
  htmlBook: HtmlBookModel;
  bookmarks: BookmarkModel[];
  time: number;
  handleFetchBookmarks: () => void;
  handleSearch: (isSearch: boolean) => void;
  t: (title: string) => string;
}

export interface NavigationPanelState {
  currentTab: string;
  chapters: any;
  startIndex: number;
  currentIndex: number;
  searchState: string;
  searchList: any;
  isNavLocked: boolean;
}
