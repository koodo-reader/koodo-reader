import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
export interface PopupNoteProps {
  currentEpub: any;
  currentBook: BookModel;
  notes: NoteModel[];
  flattenChapters: any;
  color: number;
  noteKey: string;
  pageWidth: number;
  pageHeight: number;
  chapterIndex: number;
  chapter: string;
  handleNoteKey: (key: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
}
export interface PopupNoteState {
  tag: string[];
}
