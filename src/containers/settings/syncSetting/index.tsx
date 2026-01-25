import { connect } from "react-redux";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleFetchBooks,
  handleFetchPlugins,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
  handleFetchLoginOptionList,
  handleTokenDialog,
  handleSettingMode,
  handleSettingDrive,
  handleLoadingDialog,
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchUserInfo,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    plugins: state.manager.plugins,
    isAuthed: state.manager.isAuthed,
    settingDrive: state.manager.settingDrive,
    userInfo: state.manager.userInfo,
    dataSourceList: state.backupPage.dataSourceList,
    defaultSyncOption: state.backupPage.defaultSyncOption,
    loginOptionList: state.backupPage.loginOptionList,
    cloudSyncFunc: state.book.cloudSyncFunc,
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
