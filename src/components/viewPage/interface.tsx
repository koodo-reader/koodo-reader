import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
export interface ViewPageProps {
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
  locations: any;
  isShowBookmark: boolean;
  handlePercentage: (percentage: number) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleShowBookmark: (isShowBookmark: boolean) => void;
}

export interface ViewPageState {
  isSingle: boolean;
}
