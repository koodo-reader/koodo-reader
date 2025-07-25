import { connect } from "react-redux";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleFetchBooks,
  handleFetchPlugins,
  handleTokenDialog,
  handleSettingMode,
  handleSettingDrive,
  handleLoadingDialog,
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
  handleFetchLoginOptionList,
  handleFetchUserInfo,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
    plugins: state.manager.plugins,
    isAuthed: state.manager.isAuthed,
    isShowSupport: state.manager.isShowSupport,
    settingMode: state.manager.settingMode,
    settingDrive: state.manager.settingDrive,
    userInfo: state.manager.userInfo,
    notes: state.reader.notes,
    dataSourceList: state.backupPage.dataSourceList,
    defaultSyncOption: state.backupPage.defaultSyncOption,
    loginOptionList: state.backupPage.loginOptionList,
    isOpenTokenDialog: state.backupPage.isOpenTokenDialog,
  };
};
const actionCreator = {
  handleSetting,
  handleFetchBooks,
  handleFetchPlugins,
  handleFetchDataSourceList,
  handleTokenDialog,
  handleFetchDefaultSyncOption,
  handleSettingMode,
  handleSettingDrive,
  handleFetchLoginOptionList,
  handleLoadingDialog,
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchUserInfo,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(SettingDialog as any) as any) as any);
