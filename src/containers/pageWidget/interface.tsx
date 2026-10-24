import BookModel from "../../models/Book";
import HtmlBookModel from "../../models/HtmlBook";
export interface PageWidgetProps {
  currentBook: BookModel;
  currentChapter: string;
  readerMode: string;

  isNavLocked: boolean;
  isSettingLocked: boolean;
  isDockedRight: boolean;
  isAuthed: boolean;
  htmlBook: HtmlBookModel;
  isShowBookmark: boolean;
  isHideFooter: boolean;
  isHideHeader: boolean;
  isShowPageBorder: boolean;
  textOrientation: string;
  backgroundColor: string;

  t: (title: string) => string;
  handleFetchNotes: () => void;


  jumpPosition: object | null;
  handleJumpPosition: (jumpPosition: object | null) => void;
}
export interface PageWidgetState {
  isSingle: boolean;
  prevPage: number;
  nextPage: number;
  currentTime: string;
  percentage: string;
  ignoreNextPageChange: boolean;
}
