import BookModel from "../../../models/Book";
import HtmlBook from "../../../models/HtmlBook";
import NoteModel from "../../../models/Note";
export interface PopupOptionProps {
  currentBook: BookModel;
  selection: string;
  notes: NoteModel[];
  color: number;
  noteKey: string;
  rect: DOMRect;
  cfiRange: string;
  chapterDocIndex: number;
  chapter: string;
  htmlBook: HtmlBook;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleNoteKey: (key: string) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchNotes: () => void;
  handleOriginalText: (originalText: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
  t: (title: string) => string;
}
