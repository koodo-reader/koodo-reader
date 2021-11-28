import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";

export interface ViewAreaProps {
  rendition: any;
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
  flattenChapters: any;
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
  // cfiRange: any;
  rect: any;
  chapterIndex: number;
  chapter: string;
  pageWidth: number;
  pageHeight: number;
}
