import { connect } from "../../store/legacyConnect";
import { withTranslation } from "react-i18next";
import {
  handleSortDisplay,
  handleSetting,
  handleSettingMode,
  handleAbout,
  handleLocalFileDialog,
  handleFetchBooks,
  handleFetchNotes,
  handleFetchAuthed,
  handleFetchBookmarks,
  handleFetchDefaultSyncOption,
  handleFetchDataSourceList,
  handleCloudSyncFunc,
  handleFetchUserInfo,
  handleReadingBook,
  handleCollectionDetailDialog,
  handleCurrentCollectionKey,
} from "../../store/actions";
import { stateType } from "../../store";
import Header from "./component";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {

    isCollapsed: state.sidebar.isCollapsed,
    currentBook: state.book.currentBook,
    mode: state.sidebar.mode,
    isAuthed: state.manager.isAuthed,
    defaultSyncOption: state.backupPage.defaultSyncOption,
    userInfo: state.manager.userInfo,
    isSortDisplay: state.manager.isSortDisplay,
    importBookFunc: state.book.importBookFunc,
  };
};
const actionCreator = {
  handleSortDisplay,
  handleLocalFileDialog,
  handleSetting,
  handleSettingMode,
  handleAbout,
  handleFetchBooks,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchAuthed,
  handleFetchDefaultSyncOption,
  handleFetchDataSourceList,
  handleCloudSyncFunc,
  handleFetchUserInfo,
  handleReadingBook,
  handleCollectionDetailDialog,
  handleCurrentCollectionKey,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Header as any) as any) as any);
