import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";

export interface ViewAreaProps {
  rendition: any;
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
  locations: any;
  isShowBookmark: boolean;
  chapters: any[];
  isShow: boolean;
  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;
  handlePercentage: (percentage: number) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleShowBookmark: (isShowBookmark: boolean) => void;
  handleReadingEpub: (epub: object) => void;
}
export interface ViewAreaStates {
  loading: boolean;
  cfiRange: any;
  contents: any;
  // rendition: any;
  rect: any;
}
