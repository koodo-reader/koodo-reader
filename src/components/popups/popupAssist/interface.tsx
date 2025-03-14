import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";
export interface PopupAssistProps {
  originalText: string;
  plugins: PluginModel[];
  isAuthed: boolean;
  currentBook: BookModel;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchPlugins: () => void;
  t: (title: string) => string;
}
export interface PopupAssistState {
  sumText: string;
  prototype: string;
  sumService: string;
  sumTarget: string;
  isAddNew: boolean;
}
