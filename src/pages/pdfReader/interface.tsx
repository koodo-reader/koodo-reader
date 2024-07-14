import BookModel from "../../models/Book";
import Note from "../../models/Note";

export interface ViewerProps {
  book: BookModel;
  currentBook: BookModel;
  isReading: boolean;
  isOpenMenu: boolean;
  menuMode: string;
  notes: Note[];
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  t: (title: string) => string;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleNoteKey: (key: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
}
export interface ViewerState {
  href: string;
  title: string;
  chapterDocIndex: number;
  cfiRange: any;
  contents: any;
  isTouch: boolean;
  rect: any;
  loading: boolean;
  isDisablePopup: boolean;
}
