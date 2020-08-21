import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
export interface PopupOptionProps {
  currentBook: BookModel;
  currentEpub: any;
  selection: string;
  digests: NoteModel[];
  notes: NoteModel[];
  chapters: any;
  color: number;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
  handleOriginalText: (originalText: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
}
