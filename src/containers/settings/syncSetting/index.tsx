import { connect } from "react-redux";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleFetchBooks,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
  handleTokenDialog,
  handleSettingMode,
  handleSettingDrive,
  handleLoadingDialog,
  handleFetchUserInfo,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isAuthed: state.manager.isAuthed,
    settingDrive: state.manager.settingDrive,
    dataSourceList: state.backupPage.dataSourceList,
    defaultSyncOption: state.backupPage.defaultSyncOption,
    cloudSyncFunc: state.book.cloudSyncFunc,
  };
};
const actionCreator = {
  handleSetting,
  handleFetchBooks,
  handleFetchDataSourceList,
  handleTokenDialog,
  handleFetchDefaultSyncOption,
  handleSettingMode,
  handleSettingDrive,
  handleLoadingDialog,
  handleFetchUserInfo,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(SettingDialog as any) as any) as any);
