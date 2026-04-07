import { connect } from "react-redux";
import AISetting from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleFetchPlugins,
  handleSettingMode,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    plugins: state.manager.plugins,
  };
};
const actionCreator = {
  handleSetting,
  handleFetchPlugins,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(AISetting as any) as any) as any);
