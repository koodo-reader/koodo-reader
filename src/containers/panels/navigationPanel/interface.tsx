import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface NavigationPanelProps {
  currentBook: BookModel;
  htmlBook: HtmlBookModel;

  totalDuration: number;
  backgroundColor: string;
  isNavLocked: boolean;
  handleFetchBookmarks: () => void;
  handleSearch: (isSearch: boolean) => void;
  handleNavLock: (isNavLocked: boolean) => void;
  t: (title: string) => string;
  renderBookFunc: () => void;
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
