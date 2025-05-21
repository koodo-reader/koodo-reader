import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleFetchPlugins,
  handleFetchBookSortCode,
  handleFetchNoteSortCode,
  handleFetchList,
  handleDetailDialog,
  handleLoadingDialog,
  handleNewDialog,
  handleShowSupport,
  handleFeedbackDialog,
  handleSetting,
  handleBackupDialog,
  handleImportDialog,
  handleFetchNotes,
  handleFetchBookmarks,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingState,
} from "../../store/actions";
import { withTranslation } from "react-i18next";

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
    shelfTitle: state.sidebar.shelfTitle,
    isOpenEditDialog: state.book.isOpenEditDialog,
    isDetailDialog: state.manager.isDetailDialog,
    isAuthed: state.manager.isAuthed,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    isOpenAddDialog: state.book.isOpenAddDialog,
    isSettingOpen: state.manager.isSettingOpen,
    isOpenFeedbackDialog: state.manager.isOpenFeedbackDialog,
    isAboutOpen: state.manager.isAboutOpen,
    isBookSort: state.manager.isBookSort,
    isSortDisplay: state.manager.isSortDisplay,
    isShowLoading: state.manager.isShowLoading,
    isShowNew: state.manager.isShowNew,
    isShowSupport: state.manager.isShowSupport,
    DetailDialog: state.manager.isDetailDialog,
    isBackup: state.backupPage.isBackup,
    isOpenImportDialog: state.backupPage.isOpenImportDialog,
    isOpenSortShelfDialog: state.backupPage.isOpenSortShelfDialog,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleFetchPlugins,
  handleFetchNotes,
  handleSetting,
  handleFetchBookmarks,
  handleFetchBookSortCode,
  handleFetchNoteSortCode,
  handleFetchList,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleFeedbackDialog,
  handleDetailDialog,
  handleLoadingDialog,
  handleNewDialog,
  handleShowSupport,
  handleBackupDialog,
  handleImportDialog,
  handleReadingState,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Manager as any) as any) as any);
