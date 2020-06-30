import BookmarkModel from "../../model/Bookmark";
import DigestModel from "../../model/Digest";
import NoteModel from "../../model/Note";
export interface DeleteIconProps {
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: DigestModel[];
  mode: string;
  itemKey: string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleFetchDigests: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface DeleteIconStates {
  deleteIndex: number;
}
