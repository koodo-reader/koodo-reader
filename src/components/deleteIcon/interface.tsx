import BookModel from "../../models/Book";
export interface DeleteIconProps {
  mode: string;
  index: number;
  tagName: string;
  itemKey: string;
  renderHighlighters: () => void;
  handleShowDelete: (Deletekey: string) => void;
  handleChangeTag: (index: number) => void;
}
export interface DeleteIconStates {
  isOpenDelete: boolean;
}
