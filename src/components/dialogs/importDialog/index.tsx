import {
  handleImportDialog,
  handleSetting,
  handleSettingMode,
  handleSettingDrive,
} from "../../../store/actions";
import { connect } from "../../../store/legacyConnect";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";
import ImportDialog from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    isAuthed: state.manager.isAuthed,
    dataSourceList: state.backupPage.dataSourceList,
    importBookFunc: state.book.importBookFunc,
  };
};
const actionCreator = {
  handleImportDialog,
  handleSetting,
  handleSettingMode,
  handleSettingDrive,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(ImportDialog as any) as any) as any);
