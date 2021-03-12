export interface PopupTransProps {
  originalText: string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
}
export interface PopupTransState {
  translatedText: string;
}
