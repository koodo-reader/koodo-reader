import BookModel from "../../../models/Book";
import HtmlBook from "../../../models/HtmlBook";
import { HighlightValue } from "../../../utils/common";

export interface PopupMenuProps {
  currentBook: BookModel;
  isOpenMenu: boolean;

  menuMode: string;

  highlight: HighlightValue;
  rendition: any;
  htmlBook: HtmlBook;
  // cfiRange: any;
  rect: any;

  chapterDocIndex: number;
  chapter: string;
  readerMode: string;
  handleNoteKey: (key: string) => void;
  t: (title: string) => string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;

  handleOriginalText: (originalText: string) => void;
  handleOriginalSentence: (originalSentence: string) => void;
  handleFetchNotes: () => void;
}
export interface PopupMenuStates {
  // cfiRange: string;
  rect: DOMRect | null;
}
