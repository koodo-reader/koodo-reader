import BookModel from "../../model/Book";
import Note from "../../model/Note";

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
  cfiRange: any;
  contents: any;
  rect: any;
  loading: boolean;
  isDisablePopup: boolean;
}
