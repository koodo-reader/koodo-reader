import BookModel from "../../../model/Book";
import BookmarkModel from "../../../model/Bookmark";
import HtmlBookModel from "../../../model/HtmlBook";

export interface NavigationPanelProps {
  currentEpub: any;
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
  cover: string;
  startIndex: number;
  currentIndex: number;
  isSearch: boolean;
  searchList: any;
  isNavLocked: boolean;
}
