import {
  handleBackupDialog,
  handleTokenDialog,
  handleMessageBox,
  handleMessage,
  handleLoadingDialog,
  handleTipDialog,
} from "../../../store/actions";
import { connect } from "react-redux";

import { stateType } from "../../../store";
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
  handleTipDialog,
};
export default connect(mapStateToProps, actionCreator)(BackupDialog);
