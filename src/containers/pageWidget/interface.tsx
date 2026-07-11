import BookModel from "../../models/Book";
import HtmlBookModel from "../../models/HtmlBook";
import NoteModel from "../../models/Note";
export interface PageWidgetProps {
  currentBook: BookModel;
  currentChapter: string;
  readerMode: string;
  currentChapterIndex: number;
  isNavLocked: boolean;
  isSettingLocked: boolean;
  isAuthed: boolean;
  htmlBook: HtmlBookModel;
  isShowBookmark: boolean;
  isHideFooter: boolean;
  isHideHeader: boolean;
  isShowPageBorder: boolean;
  textOrientation: string;
  backgroundColor: string;
  notes: NoteModel[];
  t: (title: string) => string;
  handleFetchNotes: () => void;
  handleCurrentChapter: (currentChapter: string) => void;
  handleCurrentChapterIndex: (currentChapterIndex: number) => void;
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
