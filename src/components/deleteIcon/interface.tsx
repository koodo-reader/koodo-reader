import BookmarkModel from "../../model/Bookmark";
import NoteModel from "../../model/Note";
export interface DeleteIconProps {
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  mode: string;
  index: number;
  tagName: string;
  isReading: boolean;
  itemKey: string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  renderHighlighters: () => void;
  handleShowDelete: (Deletekey: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleShowBookmark: (isShowBookmark: boolean) => void;
  handleChangeTag: (index: number) => void;
}
export interface DeleteIconStates {
  deleteIndex: number;
  isOpenDelete: boolean;
}
