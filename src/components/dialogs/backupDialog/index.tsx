import {
  handleBackupDialog,
  handleTokenDialog,
  handleLoadingDialog,
  handleTipDialog,
  handleFetchBooks,
} from "../../../store/actions";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
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
  handleTokenDialog,
  handleLoadingDialog,
  handleTipDialog,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(BackupDialog));
