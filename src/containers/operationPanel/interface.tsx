import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";

export interface OperationPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  flattenChapters: any;
  locations: any;
  rendition: any;
  time: number;
  handleBookmarks: (bookmarks: BookmarkModel[]) => void;
  handleReadingState: (isReading: boolean) => void;
  handleFetchBookmarks: () => void;
  handleSearch: (isSearch: boolean) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleShowBookmark: (isShowBookmark: boolean) => void;
}

export interface OperationPanelState {
  isFullScreen: boolean;
  isBookmark: boolean;
  time: number;
  currentPercentage: number;
  timeLeft: number;
}
