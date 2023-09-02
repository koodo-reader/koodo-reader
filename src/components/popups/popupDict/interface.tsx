export interface PopupDictProps {
  originalText: string;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  t: (title: string) => string;
}
export interface PopupDictState {
  dictText: string;
  dictService: string;
  dictTarget: string;
}
