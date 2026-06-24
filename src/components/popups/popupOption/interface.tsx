import BookModel from "../../../models/Book";
import HtmlBook from "../../../models/HtmlBook";
import { HighlightValue } from "../../../utils/reader/highlightUtil";
export interface PopupOptionProps {
  currentBook: BookModel;
  selection: string;
  popupOptionUpdateIndex: number;

  highlight: HighlightValue;
  noteKey: string;
  rect: DOMRect;
  cfiRange: string;
  chapterDocIndex: number;
  chapter: string;
  htmlBook: HtmlBook;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleNoteKey: (key: string) => void;
  handleMenuMode: (menu: string) => void;
  handlePopupOptionDialog: (isOpenPopupOptionDialog: boolean) => void;
  handleSpeechDialog: (isSpeechOpen: boolean) => void;
  handleSpeechStartText: (speechStartText: string) => void;
  handleSpeechAutoStart: (isSpeechAutoStart: boolean) => void;
  handleFetchNotes: () => void;
  handleOriginalText: (originalText: string) => void;
  handleOriginalSentence: (originalSentence: string) => void;
  handleQuoteText: (quoteText: string) => void;
  handleChangeDirection: (isChangeDirection: boolean) => void;
  t: (title: string) => string;
}
