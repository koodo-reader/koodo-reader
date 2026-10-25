import BookModel from "../../../models/Book";
export interface PopupBoxProps {


  rendition: any;
  // cfiRange: any;
  rect: any;

  chapterDocIndex: number;
  chapter: string;


}
export interface PopupBoxStates {
  deleteKey: string;
  rect: DOMRect | null;
  isShowUrl: boolean;
  popupWidth: number;
  popupHeight: number;
  popupLeft: number;
  popupBottom: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  isNearBottom: boolean;
  isNearRight: boolean;
  isDockedRight: boolean;
}
