import BookModel from "../../../models/Book";

export interface ActionDialogProps {
  book: BookModel;



  left: number;
  top: number;


  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
}
export interface ActionDialogState {
  isShowExport: boolean;
  isShowMark: boolean;

  isExceed: boolean;
}
