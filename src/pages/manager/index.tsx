import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleFetchBookSortCode,
  handleFetchList,
  handleMessageBox,
  handleTipDialog,
  handleLoadingDialog,
  handleNewDialog,
  handleSetting,
} from "../../store/actions/manager";
import { handleBackupDialog } from "../../store/actions/backupPage";
import {
  handleFetchNotes,
  handleFetchBookmarks,
} from "../../store/actions/reader";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
} from "../../store/actions/book";
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
    isAboutOpen: state.manager.isAboutOpen,
    isBookSort: state.manager.isBookSort,
    isSortDisplay: state.manager.isSortDisplay,
    isShowLoading: state.manager.isShowLoading,
    isShowNew: state.manager.isShowNew,
    isTipDialog: state.manager.isTipDialog,
    isMessage: state.manager.isMessage,
    isBackup: state.backupPage.isBackup,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleFetchNotes,
  handleSetting,
  handleFetchBookmarks,
  handleFetchBookSortCode,
  handleFetchList,
  handleMessageBox,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleTipDialog,
  handleLoadingDialog,
  handleNewDialog,
  handleBackupDialog,
};
export default connect(mapStateToProps, actionCreator)(withRouter(Manager));
