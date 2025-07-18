import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import {
  handleSortDisplay,
  handleSetting,
  handleSettingMode,
  handleAbout,
  handleBackupDialog,
  handleLocalFileDialog,
  handleFeedbackDialog,
  handleFetchBooks,
  handleFetchNotes,
  handleFetchAuthed,
  handleFetchBookmarks,
  handleFetchDefaultSyncOption,
  handleFetchLoginOptionList,
  handleFetchDataSourceList,
  handleCloudSyncFunc,
  handleFetchUserInfo,
} from "../../store/actions";
import { stateType } from "../../store";
import Header from "./component";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    isSearch: state.manager.isSearch,
    isAboutOpen: state.manager.isAboutOpen,
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
    isCollapsed: state.sidebar.isCollapsed,
    isNewWarning: state.manager.isNewWarning,
    notes: state.reader.notes,
    isAuthed: state.manager.isAuthed,
    defaultSyncOption: state.backupPage.defaultSyncOption,
    isSortDisplay: state.manager.isSortDisplay,
  };
};
const actionCreator = {
  handleSortDisplay,
  handleBackupDialog,
  handleLocalFileDialog,
  handleSetting,
  handleSettingMode,
  handleAbout,
  handleFeedbackDialog,
  handleFetchBooks,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchAuthed,
  handleFetchDefaultSyncOption,
  handleFetchLoginOptionList,
  handleFetchDataSourceList,
  handleCloudSyncFunc,
  handleFetchUserInfo,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Header as any) as any) as any);
