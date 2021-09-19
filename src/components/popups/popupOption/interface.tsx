import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
export interface PopupOptionProps {
  currentBook: BookModel;
  currentEpub: any;
  selection: string;
  digests: NoteModel[];
  notes: NoteModel[];
  flattenChapters: any;
  color: number;
  rect: DOMRect;
  cfiRange: string;
  contents: any;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
  handleOriginalText: (originalText: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
  t: (title: string) => string;
}
