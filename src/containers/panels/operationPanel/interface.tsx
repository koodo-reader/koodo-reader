import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
import HtmlBookModel from "../../../model/HtmlBook";
import BookmarkModel from "../../../model/Bookmark";
import { RouteComponentProps } from "react-router";

export interface OperationPanelProps extends RouteComponentProps<any> {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  books: BookModel[];
  htmlBook: HtmlBookModel;
  flattenChapters: any;
  locations: any;
  rendition: any;
  time: number;
  handleBookmarks: (bookmarks: BookmarkModel[]) => void;
  handleReadingState: (isReading: boolean) => void;
  handleFetchBookmarks: () => void;
  handleSearch: (isSearch: boolean) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleShowBookmark: (isShowBookmark: boolean) => void;
  t: (title: string) => string;
  handleHtmlBook: (htmlBook: HtmlBookModel | null) => void;
}

export interface OperationPanelState {
  isFullScreen: boolean;
  isBookmark: boolean;
  time: number;
  currentPercentage: number;
  timeLeft: number;
}
