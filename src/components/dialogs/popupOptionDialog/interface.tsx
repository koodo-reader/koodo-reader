import { PopupOptionItem } from "../../../constants/popupList";

export interface PopupOptionDialogProps {
  handlePopupOptionDialog: (isOpenPopupOptionDialog: boolean) => void;
  handlePopupOptionUpdate: (popupOptionUpdateIndex: number) => void;
  isOpenPopupOptionDialog: boolean;
  t: (title: string) => string;
}

export interface PopupOptionDialogItem extends PopupOptionItem {
  id: string;
  enabled: boolean;
}

export interface PopupOptionDialogState {
  popupOptionList: PopupOptionDialogItem[];
}
