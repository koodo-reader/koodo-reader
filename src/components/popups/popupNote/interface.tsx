import BookModel from "../../../models/Book";
import HtmlBook from "../../../models/HtmlBook";
import NoteModel from "../../../models/Note";
export interface PopupNoteProps {
  currentBook: BookModel;

  color: number;
  noteKey: string;

  chapterDocIndex: number;
  chapter: string;
  htmlBook: HtmlBook;
  handleNoteKey: (key: string) => void;
  handleColor: (color: number) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleShowPopupNote: (isShowPopupNote: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
}
export interface PopupNoteState {
  tag: string[];
  text: string;
  note: NoteModel | null;
}
