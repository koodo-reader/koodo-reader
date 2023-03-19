import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";

export interface PopupMenuProps {
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
  pageWidth: number;
  pageHeight: number;
  chapterDocIndex: number;
  chapter: string;
  handleNoteKey: (key: string) => void;
  t: (title: string) => string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
  handleRenderNoteFunc: (renderNoteFunc: () => void) => void;
}
export interface PopupMenuStates {
  deleteKey: string;
  isDisablePopup: boolean;
  // cfiRange: string;
  rect: DOMRect | null;
}
