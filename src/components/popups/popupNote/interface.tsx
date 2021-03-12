import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
export interface PopupNoteProps {
  currentEpub: any;
  currentBook: BookModel;
  notes: NoteModel[];
  flattenChapters: any;
  color: number;
  noteKey: string;
  handleNoteKey: (key: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
}
export interface PopupNoteState {
  tag: string[];
}
