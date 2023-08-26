import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
export interface PopupOptionProps {
  currentBook: BookModel;
  selection: string;
  digests: NoteModel[];
  notes: NoteModel[];
  color: number;
  rect: DOMRect;
  cfiRange: string;
  chapterDocIndex: number;
  chapter: string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
  handleOriginalText: (originalText: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
  t: (title: string) => string;
}
