import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
import BookmarkModel from "../../../model/Bookmark";
export interface SettingInfoProps {
  handleSetting: (isSettingOpen: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  books: BookModel[];
}
export interface SettingInfoState {
  language: string;
  searchEngine: string;
  isTouch: boolean;
  isOpenBook: boolean;
  isDisplayDark: boolean;
  isExpandContent: boolean;
  isDisableUpdate: boolean;
  isRememberSize: boolean;
  currentThemeIndex: number;
}
