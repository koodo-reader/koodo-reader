import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import {
  handleSortDisplay,
  handleSetting,
  handleAbout,
  handleTipDialog,
  handleTip,
  handleBackupDialog,
  handleFeedbackDialog,
  handleFetchBooks,
  handleFetchNotes,
  handleFetchAuthed,
  handleFetchBookmarks,
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
    isSortDisplay: state.manager.isSortDisplay,
  };
};
const actionCreator = {
  handleSortDisplay,
  handleBackupDialog,
  handleSetting,
  handleAbout,
  handleFeedbackDialog,
  handleTipDialog,
  handleTip,
  handleFetchBooks,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchAuthed,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Header as any) as any) as any);
