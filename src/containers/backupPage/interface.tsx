import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import HighligherModel from "../../model/Highlighter";
import BookmarkModel from "../../model/Bookmark";

export interface BackupPageProps {
  handleBackupDialog: (isBackup: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  isOpenTokenDialog: boolean;
  books: BookModel[];
  notes: NoteModel[];
  digests: DigestModel[];
  highlighters: HighligherModel[];
  bookmarks: BookmarkModel[];
}
export interface BackupPageState {
  currentStep: number | null;
  isBackup: boolean | null;
  currentDrive: number | null;
}
