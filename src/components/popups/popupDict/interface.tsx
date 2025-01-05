import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";
export interface PopupDictProps {
  originalText: string;
  plugins: PluginModel[];
  currentBook: BookModel;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchPlugins: () => void;
  t: (title: string) => string;
}
export interface PopupDictState {
  dictText: string;
  word: string;
  prototype: string;
  dictService: string;
  dictTarget: string;
  isAddNew: boolean;
}
