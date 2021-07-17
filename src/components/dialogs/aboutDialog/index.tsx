import { connect } from "react-redux";
import { handleSetting, handleAbout } from "../../../store/actions";
import { stateType } from "../../../store";
import AboutDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    isSettingOpen: state.manager.isSettingOpen,
    isAboutOpen: state.manager.isAboutOpen,
    isNewWarning: state.manager.isNewWarning,
  };
};
const actionCreator = {
  handleSetting,
  handleAbout,
};
export default connect(mapStateToProps, actionCreator)(AboutDialog);
