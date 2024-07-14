import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
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
  appSkin: string;
  storageLocation: string;
  isImportPath: boolean;
  isOpenBook: boolean;
  isExpandContent: boolean;
  isDisablePopup: boolean;
  isDisableTrashBin: boolean;
  isDeleteShelfBook: boolean;
  isPreventSleep: boolean;
  isOpenInMain: boolean;
  isDisableUpdate: boolean;
  isPrecacheBook: boolean;
  isUseBuiltIn: boolean;
  isDisableCrop: boolean;
  isDisablePDFCover: boolean;
  isAutoFullscreen: boolean;
  isHideShelfBook: boolean;
  isPreventAdd: boolean;
  isLemmatizeWord: boolean;
  currentThemeIndex: number;
}
