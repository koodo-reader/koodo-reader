import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";

export interface PopupBoxProps {
  currentBook: BookModel;
  isOpenMenu: boolean;
  isChangeDirection: boolean;
  menuMode: string;
  digests: NoteModel[];
  notes: NoteModel[];
  color: number;
  rendition: any;
  // cfiRange: any;
  rect: any;
  noteKey: string;
  chapterDocIndex: number;
  chapter: string;
  handleNoteKey: (key: string) => void;
  t: (title: string) => string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
  handleRenderNoteFunc: (renderNoteFunc: () => void) => void;
}
export interface PopupBoxStates {
  deleteKey: string;
  rect: DOMRect | null;
}
