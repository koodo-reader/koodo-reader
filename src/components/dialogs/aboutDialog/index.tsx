import { connect } from "react-redux";
import { handleSetting, handleAbout } from "../../../store/actions/manager";
import { stateType } from "../../../store";
import { withNamespaces } from "react-i18next";
import AboutDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    isSettingOpen: state.manager.isSettingOpen,
    isAboutOpen: state.manager.isAboutOpen,
  };
};
const actionCreator = {
  handleSetting,
  handleAbout,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(AboutDialog as any));
