import BookModel from "../../models/Book";
import HtmlBook from "../../models/HtmlBook";

export interface TextToSpeechProps {
  locations: any;
  currentBook: BookModel;
  htmlBook: HtmlBook;
  isReading: boolean;
  t: (title: string) => string;
}
export interface TextToSpeechState {
  isSupported: boolean;
  isAudioOn: boolean;
  isAddNew: boolean;
}
