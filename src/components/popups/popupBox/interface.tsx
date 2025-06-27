import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";

export interface PopupBoxProps {
  currentBook: BookModel;
  isOpenMenu: boolean;
  isChangeDirection: boolean;
  menuMode: string;
  notes: NoteModel[];
  color: number;
  isNavLocked: boolean;
  isSettingLocked: boolean;
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
