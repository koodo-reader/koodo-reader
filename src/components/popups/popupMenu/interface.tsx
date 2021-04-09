import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";

export interface PopupMenuProps {
  currentEpub: any;
  currentBook: BookModel;
  isOpenMenu: boolean;
  isChangeDirection: boolean;
  menuMode: string;
  digests: NoteModel[];
  notes: NoteModel[];
  color: number;
  rendition: any;
  cfiRange: any;
  contents: any;
  rect: any;
  noteKey: string;
  handleNoteKey: (key: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
}
export interface PopupMenuStates {
  deleteKey: string;
  cfiRange: string;
  contents: any;
  rect: DOMRect | null;
}
