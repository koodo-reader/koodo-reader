import { createStore, applyMiddleware, compose, combineReducers } from "redux";
import thunk from "redux-thunk";
import { book } from "./reducers/book";
import { manager } from "./reducers/manager";
import { progressPanel } from "./reducers/progressPanel";
import { reader } from "./reducers/reader";
import { viewArea } from "./reducers/viewArea";
import { sidebar } from "./reducers/sidebar";
import { backupPage } from "./reducers/backupPage";
import BookModel from "../models/Book";
import NoteModel from "../models/Note";
import BookmarkModel from "../models/Bookmark";
import HtmlBookModel from "../models/HtmlBook";
import PluginModel from "../models/Plugin";
const rootReducer = combineReducers({
  book,
  manager,
  reader,
  progressPanel,
  viewArea,
  sidebar,
  backupPage,
});
const store = createStore(
  rootReducer,
  compose(
    applyMiddleware(thunk),
    (window as any).devToolsExtension
      ? (window as any).devToolsExtension()
      : (f: any) => f
  )
);
export default store;
export type stateType = {
  manager: {
    books: BookModel[];
    plugins: PluginModel[];
    deletedBooks: BookModel[];
    searchResults: number[];
    isSearch: boolean;
    isBookSort: boolean;
    isSettingOpen: boolean;
    viewMode: string;
    isSortDisplay: boolean;
    isAboutOpen: boolean;
    isShowLoading: boolean;
    isShowNew: boolean;
    userInfo: any;
    isAuthed: boolean;
    isNewWarning: boolean;
    isSelectBook: boolean;
    selectedBooks: string[];
    isTipDialog: boolean;
    settingMode: string;
    settingDrive: string;
    isDetailDialog: boolean;
    isOpenFeedbackDialog: boolean;
    bookSortCode: { sort: number; order: number };
    noteSortCode: { sort: number; order: number };
    tip: string;
  };
  book: {
    isOpenEditDialog: boolean;
    isDetailDialog: boolean;
    isOpenDeleteDialog: boolean;
    isOpenAddDialog: boolean;
    isOpenActionDialog: boolean;
    isReading: boolean;
    dragItem: string;
    currentPage: number;
    totalPage: number;
    currentBook: BookModel;
    renderBookFunc: () => void;
    renderNoteFunc: () => void;
  };
  backupPage: {
    isBackup: boolean;
    isOpenTokenDialog: boolean;
    dataSourceList: string[];
    loginOptionList: string[];
    defaultSyncOption: string;
  };
  progressPanel: {
    percentage: number;
    locations: any[];
  };
  reader: {
    bookmarks: BookmarkModel[];
    notes: NoteModel[];
    digests: NoteModel[];
    color: number;
    chapters: any[];
    noteKey: string;
    currentChapter: string;
    currentChapterIndex: number;
    originalText: string;
    htmlBook: HtmlBookModel;
  };
  sidebar: {
    mode: string;
    shelfTitle: string;
    isCollapsed: boolean;
  };
  viewArea: {
    selection: string;
    menuMode: string;
    isOpenMenu: boolean;
    isChangeDirection: boolean;
    isShowBookmark: boolean;
  };
};
