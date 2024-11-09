import Plugin from "../../../models/Plugin";

export interface PopupTransProps {
  originalText: string;
  plugins: Plugin[];
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchPlugins: () => void;
  t: (title: string) => string;
}
export interface PopupTransState {
  translatedText: string;
  originalText: string;
  transService: string;
  transTarget: string;
  transSource: string;
  isAddNew: boolean;
}
