import {
  handleLocalFileDialog,
  handleTokenDialog,
  handleLoadingDialog,
  handleFetchBooks,
} from "../../../store/actions";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";
import LocalFileDialog from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    isAuthed: state.manager.isAuthed,
    isOpenTokenDialog: state.backupPage.isOpenTokenDialog,
    dataSourceList: state.backupPage.dataSourceList,
  };
};
const actionCreator = {
  handleLocalFileDialog,
  handleTokenDialog,
  handleLoadingDialog,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(LocalFileDialog as any) as any) as any);
