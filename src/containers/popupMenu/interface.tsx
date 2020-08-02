import BookModel from "../../model/Book";
import DigestModel from "../../model/Digest";
import NoteModel from "../../model/Note";

export interface PopupMenuProps {
  currentEpub: any;
  currentBook: BookModel;
  isOpenMenu: boolean;
  isChangeDirection: boolean;
  menuMode: string;
  digests: DigestModel[];
  notes: NoteModel[];
  color:number;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
}
export interface PopupMenuStates {
  deleteKey: string;
}
