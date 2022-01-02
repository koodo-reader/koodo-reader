import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
import BookmarkModel from "../../../model/Bookmark";
export interface SettingInfoProps {
  handleSetting: (isSettingOpen: boolean) => void;
  handleTipDialog: (isTipDialog: boolean) => void;
  handleTip: (tip: string) => void;
  t: (title: string) => string;
  handleFetchBooks: () => void;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  books: BookModel[];
}
export interface SettingInfoState {
  isTouch: boolean;
  isPreventTrigger: boolean;
  isMergeWord: boolean;
  isImportPath: boolean;
  isOpenBook: boolean;
  isDisplayDark: boolean;
  isExpandContent: boolean;
  isPreventSleep: boolean;
  isOpenInMain: boolean;
  isDisableUpdate: boolean;
  isDisableAnalytics: boolean;
  isPDFCover: boolean;
  isAutoFullscreen: boolean;
  isPreventAdd: boolean;
  currentThemeIndex: number;
}
