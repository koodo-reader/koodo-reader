import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface AssistReadDialogProps {
  currentBook: BookModel;
  htmlBook: HtmlBookModel | null;



  t: (title: string) => string;
  handleAssistReadDialog: (isAssistReadOpen: boolean) => void;
  handleParagraphMode: (isParagraphMode: boolean) => void;
  handleReadingRuler: (isReadingRuler: boolean) => void;
  handleSpeedReading: (isSpeedReading: boolean) => void;
  handleAutoReading: (isAutoReading: boolean) => void;
  handleReaderMode: (readerMode: string) => void;
  renderBookFunc: () => void;
}

export interface AssistReadDialogState {
  isParagraphMode: boolean;
  isReadingRuler: boolean;
  isSpeedReading: boolean;
  isAutoReading: boolean;
}
