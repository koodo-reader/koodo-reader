import BookmarkModel from "../../model/Bookmark";
import DigestModel from "../../model/Digest";
import NoteModel from "../../model/Note";
import HighlighterModel from "../../model/Highlighter";
export interface DeleteIconProps {
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: DigestModel[];
  highlighters: HighlighterModel[];
  mode: string;
  itemKey: string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleFetchDigests: () => void;
  handleFetchHighlighters: () => void;
  renderHighlighters: () => void;
  handleShowDelete: (Deletekey: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface DeleteIconStates {
  deleteIndex: number;
}
