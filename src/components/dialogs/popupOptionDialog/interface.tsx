import { PopupOptionItem } from "../../../constants/popupList";

export interface PopupOptionDialogProps {

}

export interface PopupOptionDialogItem extends PopupOptionItem {
  id: string;
  enabled: boolean;
}

export interface PopupOptionDialogState {
  popupOptionList: PopupOptionDialogItem[];
}
