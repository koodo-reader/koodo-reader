import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
export interface PopupNoteProps {
  currentBook: BookModel;
  notes: NoteModel[];
  color: number;
  noteKey: string;
  chapterDocIndex: number;
  chapter: string;
  handleNoteKey: (key: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
}
export interface PopupNoteState {
  tag: string[];
  text: string;
}
