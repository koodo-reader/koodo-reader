import {
  handleBackupDialog,
  handleTokenDialog,
  handleLoadingDialog,
  handleFetchBooks,
  handleSetting,
  handleSettingMode,
} from "../../../store/actions";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";
import BackupDialog from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    isAuthed: state.manager.isAuthed,
    dataSourceList: state.backupPage.dataSourceList,
  };
};
const actionCreator = {
  handleBackupDialog,
  handleTokenDialog,
  handleLoadingDialog,
  handleFetchBooks,
  handleSetting,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BackupDialog as any) as any) as any);
