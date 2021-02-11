//header 页面
import { connect } from "react-redux";
import { withNamespaces } from "react-i18next";
import {
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
  handleSetting,
  handleFetchBooks,
} from "../../store/actions/manager";
import { handleBackupDialog } from "../../store/actions/backupPage";
import { stateType } from "../../store";
import Header from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    isSearch: state.manager.isSearch,
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
    notes: state.reader.notes,
    isSortDisplay: state.manager.isSortDisplay,
  };
};
const actionCreator = {
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
  handleBackupDialog,
  handleSetting,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(Header as any));
