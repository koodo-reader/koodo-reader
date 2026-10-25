import BookModel from "../../models/Book";
export interface ImportLocalProps {

  handleDrag: (isDrag: boolean) => void;
}
export interface ImportLocalState {
  isOpenFile: boolean;
  isMoreOptionsVisible: boolean;
  width: number;
}
