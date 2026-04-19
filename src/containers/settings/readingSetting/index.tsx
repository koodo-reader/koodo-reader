import { connect } from "react-redux";
import ReadingSetting from "./component";
import { withTranslation } from "react-i18next";
import { handleSetting, handleSettingMode } from "../../../store/actions";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    isAuthed: state.manager.isAuthed,
  };
};
const actionCreator = {
  handleSetting,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(ReadingSetting as any) as any) as any);
