//备份和恢复页面
import {
  handleBackupDialog,
  handleTokenDialog,
} from "../../store/actions/backupPage";
import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
  handleLoadingDialog,
} from "../../store/actions/manager";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import BackupDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    isOpenTokenDialog: state.backupPage.isOpenTokenDialog,
  };
};
const actionCreator = {
  handleBackupDialog,
  handleMessageBox,
  handleMessage,
  handleTokenDialog,
  handleLoadingDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(BackupDialog as any));
