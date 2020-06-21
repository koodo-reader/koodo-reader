import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
export interface NavigationPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  handleFetchBookmarks: () => void;
}

export interface NavigationPanelState {
  isContentShow: boolean;
  chapters: any;
  cover: string;
  time: number;
}
