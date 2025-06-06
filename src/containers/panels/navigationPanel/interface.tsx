import BookModel from "../../../models/Book";
import BookmarkModel from "../../../models/Bookmark";
import HtmlBookModel from "../../../models/HtmlBook";

export interface NavigationPanelProps {
  currentBook: BookModel;
  htmlBook: HtmlBookModel;
  bookmarks: BookmarkModel[];
  totalDuration: number;
  isNavLocked: boolean;
  handleFetchBookmarks: () => void;
  handleSearch: (isSearch: boolean) => void;
  handleNavLock: (isNavLocked: boolean) => void;
  t: (title: string) => string;
}

export interface NavigationPanelState {
  currentTab: string;
  chapters: any;
  startIndex: number;
  currentIndex: number;
  searchState: string;
  searchList: any;
  cover: string;
  isCoverExist: boolean;
}
