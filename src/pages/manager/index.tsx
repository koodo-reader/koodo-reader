import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleFetchBookSortCode,
  handleFetchList,
  handleMessageBox,
  handleFirst,
} from "../../store/actions/manager";
import {
  handleFetchNotes,
  handleFetchBookmarks,
} from "../../store/actions/reader";
import "./manager.css";
import { stateType } from "../../store";
import Manager from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    notes: state.reader.notes,
    digests: state.reader.digests,
    bookmarks: state.reader.bookmarks,
    isReading: state.book.isReading,
    mode: state.sidebar.mode,
    dragItem: state.book.dragItem,
    shelfIndex: state.sidebar.shelfIndex,
    isOpenEditDialog: state.book.isOpenEditDialog,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    isOpenAddDialog: state.book.isOpenAddDialog,
    isSettingOpen: state.manager.isSettingOpen,
    isBookSort: state.manager.isBookSort,
    isSortDisplay: state.manager.isSortDisplay,
    isShowLoading: state.manager.isShowLoading,
    isShowNew: state.manager.isShowNew,
    isMessage: state.manager.isMessage,
    isBackup: state.backupPage.isBackup,
    isFirst: state.manager.isFirst,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchBookSortCode,
  handleFetchList,
  handleMessageBox,
  handleFirst,
};
export default connect(mapStateToProps, actionCreator)(withRouter(Manager));
