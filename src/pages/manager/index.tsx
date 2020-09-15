import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleFetchSortCode,
  handleFetchList,
  handleMessageBox,
  handleFirst,
} from "../../redux/actions/manager";
import {
  handleFetchNotes,
  handleFetchBookmarks,
} from "../../redux/actions/reader";
import "./manager.css";
import { stateType } from "../../redux/store";
import Manager from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    covers: state.manager.covers,
    notes: state.reader.notes,
    digests: state.reader.digests,
    bookmarks: state.reader.bookmarks,
    isReading: state.book.isReading,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
    isOpenEditDialog: state.book.isOpenEditDialog,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    isOpenAddDialog: state.book.isOpenAddDialog,
    isSettingOpen: state.manager.isSettingOpen,
    isSort: state.manager.isSort,
    isSortDisplay: state.manager.isSortDisplay,
    isMessage: state.manager.isMessage,
    isBackup: state.backupPage.isBackup,
    isFirst: state.manager.isFirst,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchSortCode,
  handleFetchList,
  handleMessageBox,
  handleFirst,
};
export default connect(mapStateToProps, actionCreator)(Manager);
