import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";

export interface OperationPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  flattenChapters: any;
  handleBookmarks: (bookmarks: BookmarkModel[]) => void;
  handleReadingState: (isReading: boolean) => void;
  handleFetchBookmarks: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleShowBookmark: (isShowBookmark: boolean) => void;
}

export interface OperationPanelState {
  isFullScreen: boolean;
  isBookmark: boolean;
}
