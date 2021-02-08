import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";

export interface NavigationPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  time: number;
  handleFetchBookmarks: () => void;
  handleSearch: (isSearch: boolean) => void;
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
