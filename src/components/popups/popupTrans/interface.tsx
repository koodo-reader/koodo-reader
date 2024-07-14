export interface PopupTransProps {
  originalText: string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
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
