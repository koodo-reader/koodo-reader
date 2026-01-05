import BookModel from "../../models/Book";
import PluginModel from "../../models/Plugin";
import HtmlBook from "../../models/HtmlBook";

export interface TextToSpeechProps {
  currentBook: BookModel;
  plugins: PluginModel[];
  htmlBook: HtmlBook;
  isReading: boolean;
  readerMode: string;
  handleFetchPlugins: () => void;
  t: (title: string) => string;
}
export interface TextToSpeechState {
  isSupported: boolean;
  isAudioOn: boolean;
  isAddNew: boolean;
}
