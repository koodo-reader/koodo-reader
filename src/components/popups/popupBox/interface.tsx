import BookModel from "../../../models/Book";
export interface PopupBoxProps {
  currentBook: BookModel;


  menuMode: string;
  isNavLocked: boolean;
  isSettingLocked: boolean;
  isDockedRight: boolean;
  rendition: any;
  // cfiRange: any;
  rect: any;

  chapterDocIndex: number;
  chapter: string;
  handleNoteKey: (key: string) => void;
  t: (title: string) => string;
  renderBookFunc: () => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;


  handleDockedRight: (isDockedRight: boolean) => void;
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
