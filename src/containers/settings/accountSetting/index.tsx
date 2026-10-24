import { connect } from "../../../store/legacyConnect";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleSettingMode,
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
    isAuthed: state.manager.isAuthed,
    isShowSupport: state.manager.isShowSupport,
    userInfo: state.manager.userInfo,
    loginOptionList: state.backupPage.loginOptionList,
    cloudSyncFunc: state.book.cloudSyncFunc,
  };
};
const actionCreator = {
  handleSetting,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
  handleSettingMode,
  handleFetchLoginOptionList,
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchUserInfo,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(SettingDialog as any) as any) as any);
