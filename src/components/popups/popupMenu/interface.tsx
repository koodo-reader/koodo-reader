import BookModel from "../../../models/Book";
import HtmlBook from "../../../models/HtmlBook";

export interface PopupMenuProps {
  currentBook: BookModel;
  isOpenMenu: boolean;
  isChangeDirection: boolean;
  menuMode: string;

  color: number;
  rendition: any;
  htmlBook: HtmlBook;
  // cfiRange: any;
  rect: any;
  noteKey: string;
  chapterDocIndex: number;
  chapter: string;
  readerMode: string;
  handleNoteKey: (key: string) => void;
  t: (title: string) => string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
  handleRenderNoteFunc: (renderNoteFunc: () => void) => void;
  handleOriginalText: (originalText: string) => void;
  handleOriginalSentence: (originalSentence: string) => void;
}
export interface PopupMenuStates {
  deleteKey: string;
  isRightEdge: boolean;
  // cfiRange: string;
  rect: DOMRect | null;
}
