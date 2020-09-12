import { createStore, applyMiddleware, compose, combineReducers } from "redux";
import thunk from "redux-thunk";
import { book } from "./reducers/book";
import { manager } from "./reducers/manager";
import { progressPanel } from "./reducers/progressPanel";
import { reader } from "./reducers/reader";
import { viewArea } from "./reducers/viewArea";
import { sidebar } from "./reducers/sidebar";
import { backupPage } from "./reducers/backupPage";
import BookModel from "../model/Book";
import NoteModel from "../model/Note";
import BookmarkModel from "../model/Bookmark";
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
    epubs: any[];
    covers: { key: string; url: string }[];
    searchResults: number[];
    isSearch: boolean;
    isSort: boolean;
    isFirst: string;
    isList: string;
    isSortDisplay: boolean;
    sortCode: { sort: number; order: number };
    isMessage: boolean;
    message: string;
  };
  book: {
    isOpenEditDialog: boolean;
    isOpenDeleteDialog: boolean;
    isOpenAddDialog: boolean;
    isOpenActionDialog: boolean;
    isReading: boolean;
    currentBook: BookModel;
    currentEpub: any;
  };
  backupPage: {
    isBackup: boolean;
    isOpenTokenDialog: boolean;
  };
  progressPanel: {
    percentage: number;
    locations: any[];
  };
  reader: {
    bookmarks: BookmarkModel[];
    notes: NoteModel[];
    digests: NoteModel[];
    locations: any[];
    color: number;
    chapters: any[];
    flattenChapters: any;
    noteKey: string;
    originalText: string;
  };
  sidebar: {
    mode: string;
    shelfIndex: number;
  };
  viewArea: {
    selection: string;
    menuMode: string;
    isOpenMenu: boolean;
    isChangeDirection: boolean;
    isShowBookmark: boolean;
  };
};
