import { connect } from "react-redux";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleTipDialog,
  handleTip,
  handleFetchBooks,
  handleFetchPlugins,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
  handleTokenDialog,
} from "../../../store/actions";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
    plugins: state.manager.plugins,
    isAuthed: state.manager.isAuthed,
    notes: state.reader.notes,
    dataSourceList: state.backupPage.dataSourceList,
    defaultSyncOption: state.backupPage.defaultSyncOption,
    isOpenTokenDialog: state.backupPage.isOpenTokenDialog,
  };
};
const actionCreator = {
  handleSetting,
  handleTipDialog,
  handleTip,
  handleFetchBooks,
  handleFetchPlugins,
  handleFetchDataSourceList,
  handleTokenDialog,
  handleFetchDefaultSyncOption,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingDialog as any) as any);
